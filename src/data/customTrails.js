import { api, ApiError } from '../lib/api'
import { getStorageTrailId } from '../utils/slug'

const firstString = (...values) => {
  return values.find(value => typeof value === 'string' && value.trim()) || ''
}

const normalizeTrail = (trail) => {
  if (!trail || typeof trail !== 'object') {
    return trail
  }

  const gpxFile = firstString(
    trail.gpxFile,
    trail.gpxUrl,
    trail.gpx_url,
    trail.gpx?.url,
    trail.gpx?.publicUrl,
    trail.gpx?.publicURL
  )
  const gpxFileName = firstString(
    trail.gpxFileName,
    trail.gpxName,
    trail.gpx_name,
    trail.gpx?.name,
    gpxFile ? decodeURIComponent(gpxFile.split('/').pop().split('?')[0]) : ''
  )

  return {
    ...trail,
    gpxFile,
    gpxFileName
  }
}

const mergeTrail = (currentTrail, nextTrail) => {
  const current = normalizeTrail(currentTrail) || {}
  const next = normalizeTrail(nextTrail) || {}

  return {
    ...current,
    ...next,
    previewImage: next.previewImage || current.previewImage || '',
    galleryImages: next.galleryImages?.length ? next.galleryImages : current.galleryImages || [],
    gpxFile: next.gpxFile || current.gpxFile || '',
    gpxFileName: next.gpxFileName || current.gpxFileName || ''
  }
}

export const getRemoteAdminTrails = async () => {
  const trails = await api.get('/api/trails')
  return (trails || [])
    .map(trail => normalizeTrail(trail))
    .filter(Boolean)
}

export const getAdminTrails = async () => {
  const trailsById = new Map()

  for (const trail of await getRemoteAdminTrails()) {
    if (trail?.id) {
      trailsById.set(trail.id, mergeTrail(trailsById.get(trail.id), trail))
    }
  }

  return Array.from(trailsById.values())
}

export const getAdminTrailState = async () => {
  const trails = await getAdminTrails()
  // deletedTrailIds is no longer tracked client-side (deletion is server-side).
  // Empty Set keeps old callers that check .has() safe.
  return { trails, deletedTrailIds: new Set() }
}

export const getAdminTrailById = async (id) => {
  const trails = await getAdminTrails()
  return trails.find(trail => trail.id === id) || null
}

/**
 * @param {object} trail
 * @param {{ expectNew?: boolean }} options
 *   expectNew marks this as a *create*. The server's PUT is an upsert, so
 *   without it a reused id silently overwrites whatever trail already owns
 *   that row; with it the server answers 409 instead.
 */
export const saveRemoteAdminTrail = async (trail, { expectNew = false } = {}) => {
  if (!trail?.id) {
    throw new Error('Trasa musí mať id.')
  }
  // Slugify the id for the URL so it matches the server's slugified URL param.
  const slug = getStorageTrailId(trail.id)
  await api.put(`/api/trails/${encodeURIComponent(slug)}`, { ...trail, id: slug, expectNew })
}

export const saveAdminTrail = (trail, options) => saveRemoteAdminTrail(trail, options)

/**
 * Is this id already spoken for? Asks the server rather than the cached list,
 * because the answer decides whether a save will clobber someone else's trail.
 * A 404 is the only "free" answer — anything else is rethrown so a network
 * failure can never read as "go ahead".
 */
export const isTrailIdTaken = async (id) => {
  const slug = getStorageTrailId(id)
  if (!slug) return false
  try {
    await api.get(`/api/trails/${encodeURIComponent(slug)}`)
    return true
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return false
    }
    throw error
  }
}

/** First free "<base>-2", "<base>-3", … for the "try this instead" hint. */
export const nextFreeTrailId = (base, takenIds = []) => {
  const slug = getStorageTrailId(base)
  if (!slug) return ''
  const taken = new Set(takenIds.map(id => getStorageTrailId(id)))
  let suffix = 2
  while (taken.has(`${slug}-${suffix}`)) suffix += 1
  return `${slug}-${suffix}`
}

export const deleteRemoteAdminTrail = async (trailId) => {
  await api.delete(`/api/trails/${encodeURIComponent(trailId)}`)
}

export const removeAdminTrail = ({ trailId }) => deleteRemoteAdminTrail(trailId)

// ── Likes ────────────────────────────────────────────────────────────────
// The server computes likeCount / likedByMe on read and returns the fresh
// count from these calls, so callers can update in place without re-fetching
// the whole list.

export const setTrailLike = async (trailId, liked) => {
  const slug = getStorageTrailId(trailId)
  const path = `/api/trails/${encodeURIComponent(slug)}/like`
  return liked ? api.put(path) : api.delete(path)
}

export const getLikedTrails = async () => {
  const trails = await api.get('/api/likes')
  return (trails || []).map(trail => normalizeTrail(trail)).filter(Boolean)
}

// Re-exported so legacy callers importing getStorageTrailId from here still work.
export { getStorageTrailId }
