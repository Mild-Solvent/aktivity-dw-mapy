import { withErrors, ok, badRequest, unauthorized } from '../_lib/response.js'
import { verifyPassword, newSessionToken } from '../_lib/hash.js'
import { getUser, setSession } from '../_lib/kv.js'
import { effectiveRole, setSessionCookie, SESSION_TTL } from '../_lib/auth.js'

// POST /api/auth/login
// Body: { email, password }
// Bootstrap admin (ADMIN_BOOTSTRAP_EMAIL) can log in without a KV row — but
// only if a password has been bootstrapped. For the common case we still
// require a registered user record.
export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return badRequest(res, 'Metóda nie je podporovaná')

  let body = {}
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  } catch { return badRequest(res, 'Neplatný JSON') }
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) return badRequest(res, 'Chýba e-mail alebo heslo')

  const record = await getUser(email)
  const valid = record?.passwordHash ? await verifyPassword(password, record.passwordHash) : false
  if (!record || !valid) return unauthorized(res, 'Nesprávny e-mail alebo heslo')

  const role = effectiveRole(email, record)
  if (!role) return unauthorized(res, 'Účet neexistuje')

  const token = newSessionToken()
  await setSession(token, { email, createdAt: Date.now() }, SESSION_TTL)
  setSessionCookie(res, token)

  return ok(res, { email, role })
})
