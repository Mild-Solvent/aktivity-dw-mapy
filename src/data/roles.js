import { ADMIN_EMAILS, ROLES, isAdminEmail } from '../config/admin'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export const getRemoteRoles = async () => {
  if (!isSupabaseConfigured || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('email, role')

  if (error) {
    throw error
  }

  return data || []
}

export const saveRemoteRole = async (email, role) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nie je nastavený. Rolu nie je možné uložiť.')
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
    throw new Error('Supabase nie je nastavený. Rolu nie je možné odobrať.')
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
