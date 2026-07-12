// Tiny HTTP response helpers shared across all /api handlers.
// Vercel Node Serverless Functions take (req, res) and expect Express-style calls.

export function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json')
  res.status(status).end(JSON.stringify(body))
  return { handled: true }
}

export const ok = (res, body) => json(res, 200, body)
export const created = (res, body) => json(res, 201, body)
export const badRequest = (res, message) => json(res, 400, { error: message })
export const unauthorized = (res, message = 'Neoprávnený prístup') => json(res, 401, { error: message })
export const forbidden = (res, message = 'Prístup zamietnutý') => json(res, 403, { error: message })
export const notFound = (res, message = 'Nenájdené') => json(res, 404, { error: message })
export const conflict = (res, message) => json(res, 409, { error: message })
export const serverError = (res, message = 'Interná chyba servera') => json(res, 500, { error: message })

// Wrap an async handler so unexpected throws become 500s with a logged cause
// instead of crashing the function invocation.
export function withErrors(handler) {
  return async (req, res) => {
    try {
      return await handler(req, res)
    } catch (err) {
      console.error('[api] unhandled error:', err)
      return serverError(res)
    }
  }
}
