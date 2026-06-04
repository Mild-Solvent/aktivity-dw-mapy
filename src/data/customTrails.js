import { isSupabaseConfigured, supabase } from '../lib/supabase'

const TRAIL_STORAGE_KEY = 'adminTrailDrafts'

const firstString = (...values) => {
  return values.find(value => typeof value === 'string' && value.trim()) || ''
}

const getStorageTrailId = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const getDefaultGpxUrl = (trail) => {
  const storageTrailId = getStorageTrailId(trail?.id)
  if (!isSupabaseConfigured || !supabase || !storageTrailId) {
    return ''
  }

  const { data } = supabase.storage
    .from('trail-files')
    .getPublicUrl(`${storageTrailId}/track.gpx`)

  return data.publicUrl || ''
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
    trail.gpx?.publicURL,
    getDefaultGpxUrl(trail)
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

export const getLocalAdminTrails = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const trails = JSON.parse(window.localStorage.getItem(TRAIL_STORAGE_KEY) || '[]')
    return Array.isArray(trails) ? trails.map(normalizeTrail) : []
  } catch (error) {
    console.warn('Could not read local admin trail drafts:', error)
    return []
  }
}

const isDeletedTrail = (trail) => trail?.deleted === true

export const saveLocalAdminTrail = (trail) => {
  const existing = getLocalAdminTrails().filter(item => item.id !== trail.id)
  const nextTrails = [trail, ...existing]
  window.localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(nextTrails))
  return nextTrails
}

export const deleteLocalAdminTrail = (trailId) => {
  const nextTrails = getLocalAdminTrails().filter(item => item.id !== trailId)
  window.localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(nextTrails))
  return nextTrails
}

export const getRemoteAdminTrails = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('trails')
      .select('payload')

    if (error) {
      throw error
    }

    return (data || [])
      .map(row => normalizeTrail(row.payload))
      .filter(Boolean)
  } catch (error) {
    console.warn('Could not load Supabase trails:', error)
    return []
  }
}

export const getAdminTrailState = async () => {
  const trailsById = new Map()
  const deletedTrailIds = new Set()

  for (const trail of getLocalAdminTrails()) {
    if (trail?.id) {
      if (isDeletedTrail(trail)) {
        deletedTrailIds.add(trail.id)
        trailsById.delete(trail.id)
      } else {
        trailsById.set(trail.id, mergeTrail(trailsById.get(trail.id), trail))
        deletedTrailIds.delete(trail.id)
      }
    }
  }

  const remoteTrails = await Promise.race([
    getRemoteAdminTrails(),
    new Promise(resolve => window.setTimeout(() => resolve([]), 2500))
  ])

  for (const trail of remoteTrails) {
    if (trail?.id) {
      if (isDeletedTrail(trail)) {
        deletedTrailIds.add(trail.id)
        trailsById.delete(trail.id)
      } else {
        trailsById.set(trail.id, mergeTrail(trailsById.get(trail.id), trail))
        deletedTrailIds.delete(trail.id)
      }
    }
  }

  return {
    trails: Array.from(trailsById.values()),
    deletedTrailIds
  }
}

export const getAdminTrails = async () => {
  const { trails } = await getAdminTrailState()
  return trails
}

export const getAdminTrailById = async (id) => {
  const trails = await getAdminTrails()
  return trails.find(trail => trail.id === id) || null
}

export const saveRemoteAdminTrail = async (trail) => {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase
    .from('trails')
    .upsert({
      id: trail.id,
      payload: trail,
      created_by: trail.createdBy || null
    }, { onConflict: 'id' })

  if (error) {
    throw error
  }
}

export const saveAdminTrail = async (trail) => {
  await saveRemoteAdminTrail(trail)
  saveLocalAdminTrail(trail)
}

export const deleteRemoteAdminTrail = async (trailId) => {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase
    .from('trails')
    .delete()
    .eq('id', trailId)

  if (error) {
    throw error
  }
}

export const markRemoteAdminTrailDeleted = async (trailId, deletedBy = null) => {
  await saveRemoteAdminTrail({
    id: trailId,
    deleted: true,
    deletedBy,
    deletedAt: new Date().toISOString()
  })
}

export const markLocalAdminTrailDeleted = (trailId, deletedBy = null) => {
  return saveLocalAdminTrail({
    id: trailId,
    deleted: true,
    deletedBy,
    deletedAt: new Date().toISOString()
  })
}

export const removeAdminTrail = async ({ trailId, isStaticTrail = false, deletedBy = null }) => {
  if (isStaticTrail) {
    await markRemoteAdminTrailDeleted(trailId, deletedBy)
    markLocalAdminTrailDeleted(trailId, deletedBy)
    return
  }

  await deleteRemoteAdminTrail(trailId)
  deleteLocalAdminTrail(trailId)
}
