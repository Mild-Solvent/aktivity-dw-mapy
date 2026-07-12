// Client-side API wrapper. Replaces src/lib/supabase.js.
//
// All requests are same-origin (the SPA and /api live on the same Vercel
// domain), so the httpOnly session cookie is sent automatically with
// credentials: 'include'. No tokens or URLs live in the client bundle.

const BASE = import.meta.env.BASE_API || ''

class ApiError extends Error {
  constructor(message, status, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function request(method, path, { json, formData, signal } = {}) {
  const init = {
    method,
    credentials: 'include',
    headers: {},
    signal,
  }

  if (json !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(json)
  } else if (formData !== undefined) {
    // Let the browser set the multipart Content-Type + boundary.
    init.body = formData
  }

  const res = await fetch(`${BASE}${path}`, init)
  const text = await res.text()
  const body = text ? safeJson(text) : null
  if (!res.ok) {
    const message = (body && body.error) || `HTTP ${res.status}`
    throw new ApiError(message, res.status, body)
  }
  return body
}

function safeJson(text) {
  try { return JSON.parse(text) } catch { return null }
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { json: body, ...opts }),
  put: (path, body, opts) => request('PUT', path, { json: body, ...opts }),
  delete: (path, opts) => request('DELETE', path, opts),
  upload: (path, formData, opts) => request('POST', path, { formData, ...opts }),
}

export { ApiError }

// Drop-in compatibility flag for the old `isSupabaseConfigured` guard pattern.
// The SPA talks to same-origin /api, which is always "configured" when served
// by Vercel; kept true so any legacy guard still short-circuits cleanly.
export const isApiConfigured = true
