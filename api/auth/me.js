import { withErrors, ok, unauthorized } from '../_lib/response.js'
import { currentUser } from '../_lib/auth.js'

// GET /api/auth/me
// Returns the currently logged-in user's public profile, or 401 if anonymous.
// The SPA calls this on mount (replaces Supabase's onAuthStateChange bootstrap).
export default withErrors(async (req, res) => {
  if (req.method !== 'GET') return unauthorized(res, 'Metóda nie je podporovaná')
  const user = await currentUser(req)
  if (!user) return unauthorized(res, 'Neprihlásený')
  return ok(res, { email: user.email, role: user.role })
})
