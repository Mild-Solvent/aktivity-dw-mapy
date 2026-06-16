/**
 * gpxSimplify.js
 *
 * Client-side GPX shrinker. Oversized GPX files (high-frequency recordings with
 * tens of thousands of trackpoints and excessive coordinate precision) can be
 * megabytes large, which is painful to upload on slow connections. This utility
 * reduces the file to a fraction of its size while keeping the track shape:
 *
 *   1. Ramer–Douglas–Peucker simplification (drops redundant near-collinear pts)
 *   2. Coordinate precision trimmed to ~0.1 m (6 decimals) + trailing-zero strip
 *   3. A clean, minimal GPX is re-serialized (one track/segment, ele preserved,
 *      timestamps / extensions / waypoints dropped — not needed for a trail route)
 *
 * No npm dependencies — pure browser (DOMParser + Blob/File).
 */

const EARTH_RADIUS_M = 6371000

// ---------------------------------------------------------------------------
// Parse trackpoints (lat, lon, ele) out of a GPX document
// ---------------------------------------------------------------------------

function parseTrackpoints(gpxText) {
  const xml = new DOMParser().parseFromString(gpxText, 'text/xml')

  if (xml.querySelector('parsererror')) {
    throw new Error('Neplatný GPX súbor.')
  }

  const points = []
  for (const pt of Array.from(xml.getElementsByTagName('trkpt'))) {
    const lat = parseFloat(pt.getAttribute('lat'))
    const lon = parseFloat(pt.getAttribute('lon'))
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      continue
    }
    const eleEl = pt.getElementsByTagName('ele')[0]
    const ele = eleEl ? parseFloat(eleEl.textContent) : NaN
    points.push({ lat, lon, ele: Number.isNaN(ele) ? null : ele })
  }

  const nameEl = xml.querySelector('trk > name') || xml.querySelector('name')
  const name = nameEl ? nameEl.textContent.trim() : ''

  return { points, name }
}

// ---------------------------------------------------------------------------
// Ramer–Douglas–Peucker (iterative — safe for very large tracks)
// ---------------------------------------------------------------------------

// Project lat/lon to local planar metres (equirectangular around a reference lat).
function projectXY(points) {
  const lat0 = (points[Math.floor(points.length / 2)].lat * Math.PI) / 180
  const cosLat0 = Math.cos(lat0)
  return points.map(p => ({
    x: ((p.lon * Math.PI) / 180) * cosLat0 * EARTH_RADIUS_M,
    y: ((p.lat * Math.PI) / 180) * EARTH_RADIUS_M
  }))
}

function perpDistance(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const segLenSq = dx * dx + dy * dy
  if (segLenSq === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y)
  }
  // Distance from point p to the line through a-b
  const cross = Math.abs(dy * (p.x - a.x) - dx * (p.y - a.y))
  return cross / Math.sqrt(segLenSq)
}

function rdpSimplify(points, toleranceMeters) {
  const n = points.length
  if (n < 3) {
    return points
  }

  const xy = projectXY(points)
  const keep = new Array(n).fill(false)
  keep[0] = true
  keep[n - 1] = true

  const stack = [[0, n - 1]]
  while (stack.length) {
    const [start, end] = stack.pop()
    let maxDist = 0
    let index = -1
    for (let i = start + 1; i < end; i++) {
      const dist = perpDistance(xy[i], xy[start], xy[end])
      if (dist > maxDist) {
        maxDist = dist
        index = i
      }
    }
    if (maxDist > toleranceMeters && index !== -1) {
      keep[index] = true
      stack.push([start, index])
      stack.push([index, end])
    }
  }

  return points.filter((_, i) => keep[i])
}

// Uniform pre-decimation guard so RDP never chews on a pathologically huge array.
function capPoints(points, maxPoints) {
  if (points.length <= maxPoints) {
    return points
  }
  const step = Math.ceil(points.length / maxPoints)
  const out = []
  for (let i = 0; i < points.length; i += step) {
    out.push(points[i])
  }
  if (out[out.length - 1] !== points[points.length - 1]) {
    out.push(points[points.length - 1])
  }
  return out
}

// ---------------------------------------------------------------------------
// Serialize back to a compact GPX
// ---------------------------------------------------------------------------

function trimNumber(value, decimals) {
  let str = Number(value).toFixed(decimals)
  if (str.indexOf('.') !== -1) {
    str = str.replace(/0+$/, '').replace(/\.$/, '')
  }
  return str
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildGpx(points, name, latLonDecimals, eleDecimals) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="aktivity-dw" xmlns="http://www.topografix.com/GPX/1/1">',
    '<trk>'
  ]
  if (name) {
    lines.push(`<name>${escapeXml(name)}</name>`)
  }
  lines.push('<trkseg>')
  for (const p of points) {
    const lat = trimNumber(p.lat, latLonDecimals)
    const lon = trimNumber(p.lon, latLonDecimals)
    if (p.ele != null) {
      lines.push(`<trkpt lat="${lat}" lon="${lon}"><ele>${trimNumber(p.ele, eleDecimals)}</ele></trkpt>`)
    } else {
      lines.push(`<trkpt lat="${lat}" lon="${lon}"/>`)
    }
  }
  lines.push('</trkseg></trk></gpx>')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Shrinks a GPX File. Returns a new File when it could be made meaningfully
 * smaller, otherwise returns the original untouched. Never throws — on any
 * problem it falls back to the original file.
 *
 * @param {File} file
 * @param {object} [options]
 * @param {number} [options.targetBytes=307200]   aim for ~300 KB
 * @param {number} [options.toleranceMeters=3]     initial RDP tolerance
 * @param {number} [options.skipUnderBytes=307200] don't touch files already small
 * @returns {Promise<{file: File, simplified: boolean, originalSize: number, newSize: number, points?: number, keptPoints?: number, reason?: string}>}
 */
export async function simplifyGpxFile(file, options = {}) {
  const {
    targetBytes = 300 * 1024,
    toleranceMeters = 3,
    skipUnderBytes = 300 * 1024,
    latLonDecimals = 6,
    eleDecimals = 1
  } = options

  const originalSize = file.size

  try {
    // Already small enough — leave it alone.
    if (originalSize <= skipUnderBytes) {
      return { file, simplified: false, originalSize, newSize: originalSize, reason: 'already-small' }
    }

    const gpxText = await file.text()
    const { points: rawPoints, name } = parseTrackpoints(gpxText)

    if (rawPoints.length < 2) {
      return { file, simplified: false, originalSize, newSize: originalSize, reason: 'no-track' }
    }

    const basePoints = capPoints(rawPoints, 60000)

    // Increase tolerance progressively until under target (or we run out of tries).
    let tolerance = toleranceMeters
    let simplified = rdpSimplify(basePoints, tolerance)
    let gpx = buildGpx(simplified, name, latLonDecimals, eleDecimals)
    let attempts = 0
    while (new Blob([gpx]).size > targetBytes && attempts < 8 && simplified.length > 2) {
      tolerance *= 1.8
      simplified = rdpSimplify(basePoints, tolerance)
      gpx = buildGpx(simplified, name, latLonDecimals, eleDecimals)
      attempts += 1
    }

    const blob = new Blob([gpx], { type: 'application/gpx+xml' })

    // No real gain (or somehow bigger) — keep the original.
    if (blob.size >= originalSize) {
      return { file, simplified: false, originalSize, newSize: blob.size, reason: 'no-gain' }
    }

    const outFile = new File([blob], file.name, { type: 'application/gpx+xml' })
    return {
      file: outFile,
      simplified: true,
      originalSize,
      newSize: blob.size,
      points: rawPoints.length,
      keptPoints: simplified.length
    }
  } catch (error) {
    return { file, simplified: false, originalSize, newSize: originalSize, reason: error?.message || 'error' }
  }
}
