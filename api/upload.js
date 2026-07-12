import { withErrors, ok, badRequest, serverError } from './_lib/response.js'
import { uploadBlob, storageTrailId } from './_lib/blob.js'
import { requireRole } from './_lib/auth.js'

// POST /api/upload
// Multipart form:
//   file        — the binary to store (required)
//   path        — sub-path under tracks/<id>/, e.g. "track.gpx" or
//                 "preview-1718....webp" or "gallery-...-0.webp" (required)
//   trailId     — the trail slug (required; normalized server-side)
//   contentType — MIME override (optional; falls back to the upload's type)
//
// Returns: { url } — the public Vercel Blob URL to persist in the trail payload.
//
// Only trail managers can upload. Files live under tracks/<slug>/<path> and are
// public-read via the Blob CDN.
//
// Vercel Node Serverless functions expose multipart bodies through req.body
// only as a raw Buffer when "using" the runtime's multipart handling is off.
// We instead disable body parsing on the route config and read the stream.
// For simplicity and small files (≤ a few MB), we read the multipart boundary
// ourselves via @vercel/blob's put() accepting a Buffer.

export const config = {
  api: { bodyParser: false },
}

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB hard cap per upload

// Minimal multipart/form-data parser. The SPA sends exactly two parts
// (file + path/trailId/contentType as text fields), so we don't pull in a
// heavyweight parser. Each part's headers tell us the disposition + content-type.
function parseMultipart(buffer, boundary) {
  const fields = {}
  let filePart = null

  const sep = Buffer.from(`--${boundary}`)
  let start = buffer.indexOf(sep)
  while (start !== -1) {
    const nextStart = buffer.indexOf(sep, start + sep.length)
    if (nextStart === -1) break
    const part = buffer.slice(start + sep.length + 2, nextStart - 2) // trim \r\n

    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) { start = nextStart; continue }
    const headers = part.slice(0, headerEnd).toString('utf8')
    const body = part.slice(headerEnd + 4)

    const nameMatch = headers.match(/name="([^"]+)"/)
    if (!nameMatch) { start = nextStart; continue }
    const name = nameMatch[1]

    const filenameMatch = headers.match(/filename="([^"]*)"/)
    if (filenameMatch) {
      const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/i)
      filePart = { name, filename: filenameMatch[1], contentType: ctMatch ? ctMatch[1].trim() : 'application/octet-stream', body }
    } else {
      fields[name] = body.toString('utf8')
    }
    start = nextStart
  }
  return { fields, filePart }
}

function getBoundary(req) {
  const ct = req.headers['content-type'] || ''
  const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  return m ? (m[1] || m[2]).trim() : null
}

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return badRequest(res, 'Metóda nie je podporovaná')

  const auth = await requireRole(req, res, ['admin', 'trails_adder'])
  if (auth.handled) return

  // Collect the raw body (capped).
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BYTES) {
      return badRequest(res, `Súbor presahuje limit ${MAX_BYTES / 1024 / 1024} MB`)
    }
    chunks.push(chunk)
  }
  const buffer = Buffer.concat(chunks)

  const boundary = getBoundary(req)
  if (!boundary) return badRequest(res, 'Chýba multipart boundary')
  const { fields, filePart } = parseMultipart(buffer, boundary)
  if (!filePart) return badRequest(res, 'Chýba súbor')
  if (!fields.trailId) return badRequest(res, 'Chýba trailId')
  if (!fields.path) return badRequest(res, 'Chýba cesta súboru')

  const slug = storageTrailId(fields.trailId)
  // Sanitize the path: no leading slashes, no "..", no protocol segments.
  const safePath = String(fields.path)
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9._\-/]/g, '')
    .replace(/^\/+|\/+$/g, '')
  if (safePath.includes('..')) return badRequest(res, 'Neplatná cesta')

  const pathname = `tracks/${slug}/${safePath}`
  const contentType = fields.contentType || filePart.contentType || 'application/octet-stream'

  try {
    const url = await uploadBlob(pathname, filePart.body, contentType)
    return ok(res, { url, pathname })
  } catch (err) {
    console.error('[api/upload] put failed:', err)
    return serverError(res, 'Nepodarilo sa nahrať súbor')
  }
})
