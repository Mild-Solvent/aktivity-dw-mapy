import { withErrors, ok } from '../_lib/response.js'
import { currentUser, clearSessionCookie } from '../_lib/auth.js'
import { deleteSession } from '../_lib/kv.js'

// POST /api/auth/logout
// Clears the session cookie and deletes the session from KV. Idempotent —
// calling it while logged out still returns 200.
export default withErrors(async (req, res) => {
  if (req.method !== 'POST') return ok(res, { ok: true })
  const user = await currentUser(req)
  if (user?.token) await deleteSession(user.token)
  clearSessionCookie(res)
  return ok(res, { ok: true })
})
