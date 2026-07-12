// Role definitions for the SPA.
//
// The bootstrap admin (ADMIN_BOOTSTRAP_EMAIL) is resolved entirely server-side
// by /api/auth/me — it never appears in the client bundle. The role returned
// from the server is the single source of truth for UI gating. Client-side
// role checks below are advisory (the /api handlers enforce them for real).

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

// Kept for legacy callers that imported isAdminEmail from here. With the server
// authoritative, there is no separate "UI super-admin" concept — the role from
// /api/auth/me already accounts for the bootstrap admin.
export const isAdminEmail = () => false
