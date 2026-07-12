import { withErrors, ok, serverError } from '../_lib/response.js'
import { listTrails } from '../_lib/kv.js'
import { currentUser, isTrailManager } from '../_lib/auth.js'

// GET /api/trails
// Returns all trails. Anonymous / regular users see only status='published';
// trail managers (admin / trails_adder) also see drafts.
export default withErrors(async (req, res) => {
  if (req.method !== 'GET') return ok(res, [])

  let trails
  try {
    trails = await listTrails()
  } catch (err) {
    console.error('[api/trails] list failed:', err)
    return serverError(res, 'Nepodarilo sa načítať trasy')
  }

  const user = await currentUser(req)
  const manager = !!user && isTrailManager(user.role)
  const visible = manager ? trails : trails.filter((t) => (t.status || 'published') === 'published')

  return ok(res, visible)
})
