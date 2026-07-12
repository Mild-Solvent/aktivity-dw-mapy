import { withErrors, ok, serverError } from '../_lib/response.js'
import { listUsers } from '../_lib/kv.js'
import { requireRole } from '../_lib/auth.js'

// GET /api/roles
// Admin-only. Returns every known user with their role. The bootstrap admin
// (ADMIN_BOOTSTRAP_EMAIL) is always included as 'admin' even without a KV row,
// mirroring the old VITE_ADMIN_EMAILS behavior.
export default withErrors(async (req, res) => {
  const auth = await requireRole(req, res, ['admin'])
  if (auth.handled) return

  let users = []
  try {
    users = await listUsers()
  } catch (err) {
    console.error('[api/roles] list failed:', err)
    return serverError(res, 'Nepodarilo sa načítať role')
  }

  const bootstrap = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase()
  // The bootstrap admin's effective role is always 'admin' regardless of any
  // KV row — surface that truth to the UI so the roles table isn't misleading.
  const withEffective = users.map((u) =>
    u.email === bootstrap ? { ...u, role: 'admin' } : u
  )
  if (bootstrap && !withEffective.some((u) => u.email === bootstrap)) {
    withEffective.unshift({ email: bootstrap, role: 'admin' })
  }

  return ok(res, withEffective)
})
