/**
 * gpxMapCapture.js
 *
 * Fully client-side GPX → PNG preview generator.
 * Fetches OpenStreetMap tiles (CORS-enabled), projects the GPX track with
 * Web Mercator math, draws a glowing polyline + markers, and returns a
 * PNG data URL ready for Supabase Storage upload.
 *
 * No API keys. No npm dependencies beyond the browser itself.
 */

const TILE_SIZE = 256
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const MAX_OUTPUT_WIDTH = 800
const MAX_OUTPUT_HEIGHT = 500
const MAX_TILES_X = 5
const MAX_TILES_Y = 4

// ---------------------------------------------------------------------------
// Web Mercator helpers
// ---------------------------------------------------------------------------

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom))
}

function lat2tile(lat, zoom) {
  const rad = (lat * Math.PI) / 180
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  )
}

/**
 * Returns the pixel coordinate (within the composed tile canvas) of a
 * lat/lon point at the given zoom level, offset by the top-left tile indices.
 */
function latLonToPixel(lat, lon, zoom, tileXStart, tileYStart) {
  const rad = (lat * Math.PI) / 180
  const tileX = ((lon + 180) / 360) * Math.pow(2, zoom)
  const tileY =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  return {
    x: (tileX - tileXStart) * TILE_SIZE,
    y: (tileY - tileYStart) * TILE_SIZE
  }
}

// ---------------------------------------------------------------------------
// Zoom selection
// ---------------------------------------------------------------------------

function chooseBestZoom(minLat, maxLat, minLon, maxLon) {
  for (let zoom = 16; zoom >= 5; zoom--) {
    const x0 = lon2tile(minLon, zoom)
    const x1 = lon2tile(maxLon, zoom)
    const y0 = lat2tile(maxLat, zoom) // note: lat2tile uses inverted y
    const y1 = lat2tile(minLat, zoom)
    const tilesX = x1 - x0 + 1
    const tilesY = y1 - y0 + 1
    if (tilesX <= MAX_TILES_X && tilesY <= MAX_TILES_Y) {
      return zoom
    }
  }
  return 5
}

// ---------------------------------------------------------------------------
// GPX parser
// ---------------------------------------------------------------------------

export function parseGpx(gpxText) {
  const parser = new DOMParser()
  const xml = parser.parseFromString(gpxText, 'text/xml')

  const parseError = xml.querySelector('parsererror')
  if (parseError) {
    throw new Error('Neplatný GPX súbor.')
  }

  const trkpts = Array.from(xml.getElementsByTagName('trkpt'))
  const points = trkpts
    .map(pt => ({
      lat: parseFloat(pt.getAttribute('lat')),
      lon: parseFloat(pt.getAttribute('lon'))
    }))
    .filter(p => !isNaN(p.lat) && !isNaN(p.lon))

  if (points.length < 2) {
    throw new Error('GPX súbor neobsahuje platné body trasy.')
  }

  const nameEl = xml.querySelector('trk > name') || xml.querySelector('name')
  const name = nameEl ? nameEl.textContent.trim() : ''

  return { points, name }
}

// ---------------------------------------------------------------------------
// Tile fetching
// ---------------------------------------------------------------------------

function fetchTile(z, x, y) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ img, x, y })
    img.onerror = () => reject(new Error(`Tile ${z}/${x}/${y} sa nepodarilo načítať`))
    // Small delay stagger to avoid hammering OSM
    img.src = OSM_TILE_URL.replace('{z}', z).replace('{x}', x).replace('{y}', y)
  })
}

// ---------------------------------------------------------------------------
// Canvas drawing helpers
// ---------------------------------------------------------------------------

function drawTrackPolyline(ctx, pixels) {
  if (pixels.length < 2) return

  // Outer glow
  ctx.save()
  ctx.beginPath()
  pixels.forEach(({ x, y }, i) => {
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = 'rgba(255, 120, 0, 0.35)'
  ctx.lineWidth = 10
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.restore()

  // Main track line
  ctx.save()
  ctx.beginPath()
  pixels.forEach(({ x, y }, i) => {
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = '#ff7a00'
  ctx.lineWidth = 3.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  // Inner white highlight
  ctx.beginPath()
  pixels.forEach(({ x, y }, i) => {
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()
}

function drawMarker(ctx, x, y, color, radius = 7) {
  // Shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 6

  // Fill
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()

  // White border
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.restore()
}

function drawAttribution(ctx, canvasWidth, canvasHeight) {
  const text = '© OpenStreetMap contributors'
  const fontSize = Math.max(10, Math.round(canvasWidth * 0.015))
  ctx.save()
  ctx.font = `${fontSize}px sans-serif`
  const textWidth = ctx.measureText(text).width
  const pad = 4
  const x = canvasWidth - textWidth - pad * 2
  const y = canvasHeight - fontSize - pad

  // Background pill
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.beginPath()
  ctx.roundRect
    ? ctx.roundRect(x - pad, y - pad, textWidth + pad * 2, fontSize + pad * 2, 3)
    : ctx.rect(x - pad, y - pad, textWidth + pad * 2, fontSize + pad * 2)
  ctx.fill()

  ctx.fillStyle = '#333333'
  ctx.fillText(text, x, y + fontSize)
  ctx.restore()
}

// ---------------------------------------------------------------------------
// Decimate points for canvas performance (keep at most ~2000 pts)
// ---------------------------------------------------------------------------

function decimatePoints(points, maxPoints = 2000) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  const result = []
  for (let i = 0; i < points.length; i += step) result.push(points[i])
  // Always include last point
  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1])
  }
  return result
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Converts a GPX File object into a PNG data URL showing the track
 * overlaid on a real OpenStreetMap base map.
 *
 * @param {File} file  - A .gpx File from an <input type="file">
 * @returns {Promise<string>}  PNG data URL ("data:image/png;base64,...")
 */
export async function gpxFileToPreviewPng(file) {
  // 1. Read file text
  const gpxText = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Súbor sa nepodarilo prečítať.'))
    reader.readAsText(file)
  })

  // 2. Parse GPX
  const { points: rawPoints } = parseGpx(gpxText)
  const points = decimatePoints(rawPoints)

  // 3. Bounding box + padding
  const lats = points.map(p => p.lat)
  const lons = points.map(p => p.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  const latPad = Math.max((maxLat - minLat) * 0.18, 0.003)
  const lonPad = Math.max((maxLon - minLon) * 0.18, 0.005)
  const pMinLat = minLat - latPad
  const pMaxLat = maxLat + latPad
  const pMinLon = minLon - lonPad
  const pMaxLon = maxLon + lonPad

  // 4. Choose zoom
  const zoom = chooseBestZoom(pMinLat, pMaxLat, pMinLon, pMaxLon)

  // 5. Tile range
  const tileX0 = lon2tile(pMinLon, zoom)
  const tileX1 = lon2tile(pMaxLon, zoom)
  const tileY0 = lat2tile(pMaxLat, zoom) // top (smaller y = higher lat in Mercator)
  const tileY1 = lat2tile(pMinLat, zoom) // bottom

  const tilesWide = tileX1 - tileX0 + 1
  const tilesHigh = tileY1 - tileY0 + 1

  // 6. Create tile canvas
  const tileCanvas = document.createElement('canvas')
  tileCanvas.width = tilesWide * TILE_SIZE
  tileCanvas.height = tilesHigh * TILE_SIZE
  const tileCtx = tileCanvas.getContext('2d')

  // 7. Fetch all tiles in parallel
  const fetches = []
  for (let tx = tileX0; tx <= tileX1; tx++) {
    for (let ty = tileY0; ty <= tileY1; ty++) {
      fetches.push(fetchTile(zoom, tx, ty))
    }
  }

  const results = await Promise.allSettled(fetches)
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { img, x, y } = result.value
      tileCtx.drawImage(img, (x - tileX0) * TILE_SIZE, (y - tileY0) * TILE_SIZE)
    }
  }

  // 8. Project GPX points to pixel coords on the tile canvas
  const pixels = points.map(p => latLonToPixel(p.lat, p.lon, zoom, tileX0, tileY0))

  // 9. Draw track, markers, attribution
  drawTrackPolyline(tileCtx, pixels)
  drawMarker(tileCtx, pixels[0].x, pixels[0].y, '#2ecc71')            // start — green
  drawMarker(tileCtx, pixels[pixels.length - 1].x, pixels[pixels.length - 1].y, '#e74c3c') // end — red
  drawAttribution(tileCtx, tileCanvas.width, tileCanvas.height)

  // 10. Scale down to target output size preserving aspect ratio
  const aspect = tileCanvas.width / tileCanvas.height
  let outW = Math.min(tileCanvas.width, MAX_OUTPUT_WIDTH)
  let outH = Math.round(outW / aspect)
  if (outH > MAX_OUTPUT_HEIGHT) {
    outH = MAX_OUTPUT_HEIGHT
    outW = Math.round(outH * aspect)
  }

  const outCanvas = document.createElement('canvas')
  outCanvas.width = outW
  outCanvas.height = outH
  const outCtx = outCanvas.getContext('2d')
  outCtx.imageSmoothingEnabled = true
  outCtx.imageSmoothingQuality = 'high'
  outCtx.drawImage(tileCanvas, 0, 0, outW, outH)

  try {
    const webpUrl = outCanvas.toDataURL('image/webp', 0.85)
    if (webpUrl.startsWith('data:image/webp')) {
      return webpUrl
    }
  } catch (e) {
    // Ignore and fallback to png
  }
  return outCanvas.toDataURL('image/png')
}

/**
 * Converts a PNG data URL to a Blob (for Supabase upload).
 */
export function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const binary = atob(base64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  return new Blob([arr], { type: mime })
}
