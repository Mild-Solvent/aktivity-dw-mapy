import { isSupabaseConfigured, supabase } from '../lib/supabase'

const TRAIL_STORAGE_KEY = 'adminTrailDrafts'

export const getLocalAdminTrails = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const trails = JSON.parse(window.localStorage.getItem(TRAIL_STORAGE_KEY) || '[]')
    return Array.isArray(trails) ? trails : []
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
      .map(row => row.payload)
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
        trailsById.set(trail.id, trail)
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
        trailsById.set(trail.id, trail)
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
