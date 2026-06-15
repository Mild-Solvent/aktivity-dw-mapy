// Admin emails are configured via VITE_ADMIN_EMAILS env variable (comma-separated).
// These act as UI-level super-admins (no DB round-trip needed to show admin nav).
// The same emails MUST also be seeded into user_roles via the DB migration so that
// Postgres RLS functions (is_admin, is_trail_manager) enforce writes at the DB level.
const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || ''
export const ADMIN_EMAILS = adminEmailsEnv
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(String(email || '').trim().toLowerCase())
}

export const ROLES = {
  ADMIN: 'admin',
  TRAILS_ADDER: 'trails_adder',
  USER: 'user'
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrátor',
  [ROLES.TRAILS_ADDER]: 'Pridávateľ trás',
  [ROLES.USER]: 'Používateľ'
}

export const canAddTrails = (role) => {
  return role === ROLES.ADMIN || role === ROLES.TRAILS_ADDER
}
