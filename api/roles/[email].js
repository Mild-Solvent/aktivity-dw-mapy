import { withErrors, ok, badRequest, notFound, forbidden, serverError } from '../_lib/response.js'
import { getUser, setUser, deleteUser } from '../_lib/kv.js'
import { requireRole } from '../_lib/auth.js'

const VALID_ROLES = new Set(['admin', 'trails_adder', 'user'])

// PUT    /api/roles/[email]    body: { role }   → set role (admin only)
// DELETE /api/roles/[email]                      → remove role row, demote to 'user' (admin only)
//
// The bootstrap admin cannot be demoted or removed — the env var is the source
// of truth and always wins.
export default withErrors(async (req, res) => {
  const auth = await requireRole(req, res, ['admin'])
  if (auth.handled) return

  const email = decodeURIComponent(req.query?.email || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return badRequest(res, 'Neplatný e-mail')

  const bootstrap = (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase()
  if (email === bootstrap) {
    return forbidden(res, 'Boostrap admin nie je možné zmeniť')
  }

  if (req.method === 'PUT') {
    let body = {}
    try { body = JSON.parse(req.body || '{}') } catch { return badRequest(res, 'Neplatný JSON') }
    const role = String(body.role || '').trim().toLowerCase()
    if (!VALID_ROLES.has(role)) return badRequest(res, 'Neplatná rola')

    try {
      const record = await getUser(email)
      if (!record) return notFound(res, 'Používateľ neexistuje')

      // Preserve the password hash; only update role.
      await setUser(email, { ...record, role, updatedAt: Date.now() })
      return ok(res, { email, role })
    } catch (err) {
      console.error('[api/roles] set failed:', err)
      return serverError(res, 'Nepodarilo sa uložiť rolu')
    }
  }

  if (req.method === 'DELETE') {
    try {
      const record = await getUser(email)
      if (!record) return notFound(res, 'Používateľ neexistuje')
      // Don't lose the password — keep the row but demote to 'user'.
      await setUser(email, { ...record, role: 'user', updatedAt: Date.now() })
      return ok(res, { email, role: 'user' })
    } catch (err) {
      console.error('[api/roles] delete failed:', err)
      return serverError(res, 'Nepodarilo sa odstrániť rolu')
    }
  }

  return badRequest(res, 'Metóda nie je podporovaná')
})
