import { withErrors, created, badRequest, conflict } from '../_lib/response.js'
import { hashPassword, newSessionToken } from '../_lib/hash.js'
import { getUser, setUser, setSession } from '../_lib/kv.js'
import { setSessionCookie, SESSION_TTL } from '../_lib/auth.js'

const ROLE_USER = 'user'

// POST /api/auth/register
// Body: { email, password }
// Self-registration is open; new accounts default to role 'user'.
// Bootstrap admin (ADMIN_BOOTSTRAP_EMAIL) is always 'admin' regardless of any row.
export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return badRequest(res, 'Metóda nie je podporovaná')

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  } catch { return badRequest(res, 'Neplatný JSON') }
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest(res, 'Neplatný e-mail')
  if (password.length < 8) return badRequest(res, 'Heslo musí mať aspoň 8 znakov')

  const bootstrap = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase()
  const existing = await getUser(email)
  if (existing && email !== bootstrap) {
    return conflict(res, 'Účet s týmto e-mailom už existuje')
  }

  const passwordHash = await hashPassword(password)
  await setUser(email, { passwordHash, role: ROLE_USER, createdAt: Date.now() })

  // Auto-login: mint a session and set the cookie.
  const token = newSessionToken()
  await setSession(token, { email, createdAt: Date.now() }, SESSION_TTL)
  setSessionCookie(res, token)

  const role = email === bootstrap ? 'admin' : ROLE_USER
  return created(res, { email, role })
})
