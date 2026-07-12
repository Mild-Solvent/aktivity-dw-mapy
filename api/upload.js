import Busboy from 'busboy'
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
// Returns: { url, pathname } — the public Vercel Blob URL to persist in the
// trail payload, plus the canonical path it was stored under.
//
// Only trail managers can upload. Files live under tracks/<slug>/<path> and are
// public-read via the Blob CDN.

export const config = {
  api: { bodyParser: false },
}

const MAX_BYTES = 25 * 1024 * 1024 // 25 MB hard cap per upload

export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return badRequest(res, 'Metóda nie je podporovaná')

  const auth = await requireRole(req, res, ['admin', 'trails_adder'])
  if (auth.handled) return

  const contentType = req.headers['content-type']
  if (!contentType || !contentType.startsWith('multipart/form-data')) {
    return badRequest(res, 'Očakáva sa multipart/form-data')
  }

  // Parse multipart stream with busboy. Collect text fields and buffer the
  // single file part (capped at MAX_BYTES).
  const fields = {}
  let fileBuffer = null
  let fileContentType = null
  let sizeExceeded = false

  await new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_BYTES } })

    busboy.on('field', (name, value) => {
      fields[name] = value
    })

    busboy.on('file', (_name, stream, info) => {
      fileContentType = info.mimeType
      const chunks = []
      stream.on('data', (chunk) => {
        if (sizeExceeded) return
        chunks.push(chunk)
      })
      stream.on('end', () => {
        if (sizeExceeded) return
        fileBuffer = Buffer.concat(chunks)
      })
      stream.on('limit', () => {
        sizeExceeded = true
        stream.destroy()
      })
    })

    busboy.on('error', reject)
    busboy.on('finish', resolve)
    busboy.on('close', resolve)

    req.pipe(busboy)
  })

  if (sizeExceeded) {
    return badRequest(res, `Súbor presahuje limit ${MAX_BYTES / 1024 / 1024} MB`)
  }
  if (!fileBuffer) return badRequest(res, 'Chýba súbor')
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
  const finalContentType = fields.contentType || fileContentType || 'application/octet-stream'

  try {
    const url = await uploadBlob(pathname, fileBuffer, finalContentType)
    return ok(res, { url, pathname })
  } catch (err) {
    console.error('[api/upload] put failed:', err)
    return serverError(res, 'Nepodarilo sa nahrať súbor')
  }
})
