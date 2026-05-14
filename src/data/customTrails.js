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

export const getAdminTrails = async () => {
  const trailsById = new Map()

  for (const trail of getLocalAdminTrails()) {
    if (trail?.id) {
      trailsById.set(trail.id, trail)
    }
  }

  const remoteTrails = await Promise.race([
    getRemoteAdminTrails(),
    new Promise(resolve => window.setTimeout(() => resolve([]), 2500))
  ])

  for (const trail of remoteTrails) {
    if (trail?.id) {
      trailsById.set(trail.id, trail)
    }
  }

  return Array.from(trailsById.values())
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
