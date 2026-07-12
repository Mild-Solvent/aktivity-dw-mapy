// Auth + authorization layer for /api handlers.
//
// Replaces Supabase Auth (sessions) and RLS (role enforcement). The server is
// the gate: every write handler runs requireRole() before touching KV/Blob.
//
// Roles mirror src/config/admin.js: 'admin' | 'trails_adder' | 'user'
//   admin / trails_adder → can manage trails  ("trail manager")
//   admin                → can manage users/roles

import { getSession, getUser } from './kv.js'

export const ROLES = {
  ADMIN: 'admin',
  TRAILS_ADDER: 'trails_adder',
  USER: 'user',
}

const SESSION_COOKIE = process.env.SESSION_COOKIE || 'dw_session'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days

export const SESSION_COOKIE_NAME = SESSION_COOKIE
export const SESSION_TTL = SESSION_TTL_SECONDS

function bootstrapEmail() {
  return (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase()
}

/** Resolve the effective role for a logged-in email, honoring the bootstrap admin. */
export function effectiveRole(email, dbRecord) {
  if (!email) return null
  if (email.toLowerCase() === bootstrapEmail()) return ROLES.ADMIN
  return dbRecord?.role || null
}

/** True if role can create/edit/delete trails. */
export function isTrailManager(role) {
  return role === ROLES.ADMIN || role === ROLES.TRAILS_ADDER
}

export function isAdmin(role) {
  return role === ROLES.ADMIN
}

// ── Cookie helpers (Express-style on Vercel Node functions) ─────────────

function isHttps() {
  // Secure cookie only over HTTPS. In `vercel dev` we're on plain HTTP localhost,
  // and VERCEL_URL is set even in dev, so we can't rely on it alone.
  if (process.env.NODE_ENV !== 'production') return false
  return true
}

export function setSessionCookie(res, token) {
  const flags = [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (isHttps()) flags.push('Secure')
  res.setHeader('Set-Cookie', flags.join('; '))
}

export function clearSessionCookie(res) {
  const flags = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (isHttps()) flags.push('Secure')
  res.setHeader('Set-Cookie', flags.join('; '))
}

export function parseCookies(req) {
  const header = req.headers?.cookie || ''
  const out = {}
  for (const part of header.split(';')) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (k) out[k] = v
  }
  return out
}

// ── Request-scoped auth ─────────────────────────────────────────────────

/**
 * Resolve the current user from the request's session cookie.
 * Returns { email, role, token } or null if not authenticated.
 */
export async function currentUser(req) {
  const cookies = parseCookies(req)
  const token = cookies[SESSION_COOKIE]
  if (!token) return null
  const session = await getSession(token)
  if (!session || !session.email) return null
  const dbRecord = await getUser(session.email)
  const role = effectiveRole(session.email, dbRecord)
  if (!role) return null // user record gone (deleted) — treat as logged out
  return { email: session.email.toLowerCase(), role, token }
}

/**
 * Express-style middleware for Serverless Functions. Resolves the current
 * user, then requires one of `allowedRoles`. Calls `res` and returns
 * { handled: true } on failure; otherwise returns { user, handled: false }.
 *
 * Usage:
 *   const auth = await requireRole(req, res, [ROLES.ADMIN])
 *   if (auth.handled) return
 *   // auth.user is guaranteed to have an allowed role
 */
export async function requireRole(req, res, allowedRoles) {
  const user = await currentUser(req)
  if (!user) {
    unauthorized(res, 'Musíte byť prihlásený')
    return { handled: true }
  }
  if (!allowedRoles.includes(user.role)) {
    forbidden(res, 'Na túto akciu nemáte oprávnenie')
    return { handled: true }
  }
  return { user, handled: false }
}
