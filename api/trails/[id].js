import { withErrors, ok, created, badRequest, notFound, serverError } from '../_lib/response.js'
import { getTrail, saveTrail, deleteTrail } from '../_lib/kv.js'
import { deleteBlobsByPrefix, storageTrailId } from '../_lib/blob.js'
import { requireRole } from '../_lib/auth.js'

const VALID_STATUS = new Set(['published', 'draft'])
const TRAIL_FIELDS = new Set([
  'id', 'name', 'description', 'sport', 'activityType', 'bikeType',
  'difficulty', 'distance', 'distanceValue', 'duration', 'elevation',
  'location', 'locationRegion', 'previewImage', 'gpxFile', 'gpxFileName',
  'galleryImages', 'mapUrl', 'tags', 'status', 'createdBy', 'createdAt', 'updatedAt',
])

function sanitize(payload) {
  // Keep only known fields so a forged payload can't pollute KV with junk.
  const out = {}
  for (const k of Object.keys(payload || {})) {
    if (TRAIL_FIELDS.has(k)) out[k] = payload[k]
  }
  return out
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET    /api/trails/[id]   → public read (drafts only for managers)
// PUT    /api/trails/[id]   → create or update (trail managers only)
// DELETE /api/trails/[id]   → remove trail + its blobs (trail managers only)
export default withErrors(async (req, res) => {
  const id = decodeURIComponent(req.query?.id || '').trim()
  if (!id) return badRequest(res, 'Chýba id trasy')

  if (req.method === 'GET') {
    const trail = await getTrail(id)
    if (!trail) return notFound(res, 'Trasa nebola nájdená')
    return ok(res, trail)
  }

  // All writes require trail-manager role.
  const auth = await requireRole(req, res, ['admin', 'trails_adder'])
  if (auth.handled) return

  if (req.method === 'PUT') {
    let body = {}
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    } catch { return badRequest(res, 'Neplatný JSON') }
    if (!body.id) return badRequest(res, 'Trasa musí mať id')
    // The URL id wins; ignore a mismatched body.id to keep paths consistent.
    if (slugify(body.id) !== id) return badRequest(res, 'id v tele sa nezhoduje s URL')

    const existedBefore = await getTrail(id)

    const payload = sanitize({
      ...body,
      id,
      status: VALID_STATUS.has(body.status) ? body.status : 'published',
      updatedAt: Date.now(),
      // createdBy preserved on update if absent.
      createdBy: body.createdBy || auth.user.email,
    })

    try {
      const saved = await saveTrail(id, payload)
      return existedBefore ? ok(res, saved) : created(res, saved)
    } catch (err) {
      console.error('[api/trails] save failed:', err)
      return serverError(res, 'Nepodarilo sa uložiť trasu')
    }
  }

  if (req.method === 'DELETE') {
    const existing = await getTrail(id)
    if (!existing) return notFound(res, 'Trasa nebola nájdená')
    try {
      await deleteTrail(id)
      // Clean up orphaned blobs under tracks/<slug>/ (fixes the gap from the Supabase era).
      await deleteBlobsByPrefix(`tracks/${storageTrailId(id)}/`)
    } catch (err) {
      console.error('[api/trails] delete failed:', err)
      return serverError(res, 'Nepodarilo sa odstrániť trasu')
    }
    return ok(res, { id, deleted: true })
  }

  return badRequest(res, 'Metóda nie je podporovaná')
})
