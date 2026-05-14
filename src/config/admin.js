export const ADMIN_EMAILS = [
  'adam.molnar6353@gmail.com'
]

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
