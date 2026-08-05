import { api } from '../lib/api'
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

export const saveRemoteAdminTrail = async (trail) => {
  if (!trail?.id) {
    throw new Error('Trasa musí mať id.')
  }
  // Slugify the id for the URL so it matches the server's slugified URL param.
  const slug = getStorageTrailId(trail.id)
  await api.put(`/api/trails/${encodeURIComponent(slug)}`, { ...trail, id: slug })
}

export const saveAdminTrail = (trail) => saveRemoteAdminTrail(trail)

export const deleteRemoteAdminTrail = async (trailId) => {
  await api.delete(`/api/trails/${encodeURIComponent(trailId)}`)
}

export const removeAdminTrail = ({ trailId }) => deleteRemoteAdminTrail(trailId)

// Re-exported so legacy callers importing getStorageTrailId from here still work.
export { getStorageTrailId }
