import { ROLES } from '../config/admin'
import { api } from '../lib/api'

// The bootstrap admin is resolved server-side via ADMIN_BOOTSTRAP_EMAIL and is
// always returned by /api/roles as 'admin' — no client-side admin-email list
// is needed anymore.

export const getRemoteRoles = async () => {
  const roles = await api.get('/api/roles')
  return roles || []
}

export const saveRemoteRole = async (email, role) => {
  await api.put(`/api/roles/${encodeURIComponent(email)}`, { role })
}

export const deleteRemoteRole = async (email) => {
  await api.delete(`/api/roles/${encodeURIComponent(email)}`)
}

export const getAllRoles = async () => {
  return getRemoteRoles()
}

export const getRoleForEmail = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return ROLES.USER

  const roles = await getAllRoles()
  return roles.find(item => item.email === normalizedEmail)?.role || ROLES.USER
}
