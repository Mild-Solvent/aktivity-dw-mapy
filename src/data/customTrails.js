import { isSupabaseConfigured, supabase } from '../lib/supabase'

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

export const getRemoteAdminTrails = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('trails')
    .select('payload')

  if (error) {
    throw error
  }

  return (data || [])
    .map(row => normalizeTrail(row.payload))
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
  // deletedTrailIds is no longer tracked client-side (deletion is handled server-side by RLS).
  // Return an empty Set so existing callers that check deletedTrailIds.has() still work safely.
  return { trails, deletedTrailIds: new Set() }
}

export const getAdminTrailById = async (id) => {
  const trails = await getAdminTrails()
  return trails.find(trail => trail.id === id) || null
}

export const saveRemoteAdminTrail = async (trail) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nie je nastavený. Trasu nie je možné uložiť.')
  }

  // status must also live in the dedicated column so RLS SELECT policies
  // (which filter on the column, not the JSONB) work correctly.
  const { error } = await supabase
    .from('trails')
    .upsert({
      id: trail.id,
      payload: trail,
      created_by: trail.createdBy || null,
      status: trail.status || 'published'
    }, { onConflict: 'id' })

  if (error) {
    throw error
  }
}

export const saveAdminTrail = (trail) => saveRemoteAdminTrail(trail)

export const deleteRemoteAdminTrail = async (trailId) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nie je nastavený. Trasu nie je možné odstrániť.')
  }

  const { error } = await supabase
    .from('trails')
    .delete()
    .eq('id', trailId)

  if (error) {
    throw error
  }
}

export const removeAdminTrail = ({ trailId }) => deleteRemoteAdminTrail(trailId)
