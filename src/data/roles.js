import { ADMIN_EMAILS, ROLES, isAdminEmail } from '../config/admin'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const ROLE_STORAGE_KEY = 'adminUserRoles'

export const getLocalRoles = () => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const roles = JSON.parse(window.localStorage.getItem(ROLE_STORAGE_KEY) || '[]')
    return Array.isArray(roles) ? roles : []
  } catch (error) {
    console.warn('Could not read local roles:', error)
    return []
  }
}

export const saveLocalRole = (email, role) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const roles = getLocalRoles().filter(item => item.email !== normalizedEmail)
  const nextRoles = [
    { email: normalizedEmail, role },
    ...roles
  ]

  window.localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(nextRoles))
  return nextRoles
}

export const getRemoteRoles = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('email, role')

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    console.warn('Could not load user roles:', error)
    return []
  }
}

export const saveRemoteRole = async (email, role) => {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase
    .from('user_roles')
    .upsert({
      email: String(email || '').trim().toLowerCase(),
      role
    }, { onConflict: 'email' })

  if (error) {
    throw error
  }
}

export const deleteRemoteRole = async (email) => {
  if (!isSupabaseConfigured || !supabase) {
    return
  }

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('email', String(email || '').trim().toLowerCase())

  if (error) {
    throw error
  }
}

export const getAllRoles = async () => {
  const rolesByEmail = new Map()

  for (const email of ADMIN_EMAILS) {
    rolesByEmail.set(email, { email, role: ROLES.ADMIN })
  }

  for (const item of await getRemoteRoles()) {
    if (item?.email && !isAdminEmail(item.email)) {
      rolesByEmail.set(item.email, item)
    }
  }

  for (const item of getLocalRoles()) {
    if (item?.email && !isAdminEmail(item.email)) {
      rolesByEmail.set(item.email, item)
    }
  }

  return Array.from(rolesByEmail.values())
}

export const getRoleForEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (isAdminEmail(normalizedEmail)) {
    return ROLES.ADMIN
  }

  const roles = await getAllRoles()
  return roles.find(item => item.email === normalizedEmail)?.role || ROLES.USER
}
