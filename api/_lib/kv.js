// KV (Upstash Redis) data access layer.
//
// Written against @upstash/redis so that swapping from Vercel KV to a direct
// Upstash account later is just an env-var change — no code edits.
//
// Keys:
//   trails:index   → JSON array of trail ids (the listing)
//   trails:<id>    → JSON trail payload (the full trail object)
//   users:<email>  → JSON { passwordHash, role, createdAt }
//   sessions:<tok> → JSON { email, createdAt }
//
// We store JSON strings (not Redis hashes) so each get/set is one round-trip
// and the access pattern is dead simple to reason about.

import { Redis } from '@upstash/redis'

let _client = null

function client() {
  if (_client) return _client
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('KV not configured: set KV_REST_API_URL and KV_REST_API_TOKEN (created automatically when you add a KV store in the Vercel dashboard).')
  }
  _client = new Redis({ url, token })
  return _client
}

export function isKvConfigured() {
  return Boolean(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  )
}

// ── Trails ──────────────────────────────────────────────────────────────

/** Return every trail payload (published + draft). Order is index order. */
export async function listTrails() {
  const ids = await getTrailIndex()
  if (!ids.length) return []
  const payloads = await client().mget(ids.map((id) => `trails:${id}`))
  return payloads
    .map((p, i) => (p == null ? null : { ...p, id: ids[i] }))
    .filter(Boolean)
}

export async function getTrail(id) {
  const p = await client().get(`trails:${id}`)
  return p ? { ...p, id } : null
}

export async function saveTrail(id, payload) {
  // Upsert payload, then make sure the id is in the index.
  const pipeline = client().multi()
  pipeline.set(`trails:${id}`, payload)
  // SADD on a JSON-encoded array we own; simplest is to read+rewrite.
  const ids = await getTrailIndex()
  if (!ids.includes(id)) {
    ids.push(id)
    pipeline.set('trails:index', ids)
  }
  await pipeline.exec()
  return { ...payload, id }
}

export async function deleteTrail(id) {
  const pipeline = client().multi()
  pipeline.del(`trails:${id}`)
  const ids = await getTrailIndex()
  const next = ids.filter((x) => x !== id)
  if (next.length !== ids.length) pipeline.set('trails:index', next)
  await pipeline.exec()
}

export async function getTrailIndex() {
  const ids = await client().get('trails:index')
  return Array.isArray(ids) ? ids : []
}

// ── Users ───────────────────────────────────────────────────────────────

export async function getUser(email) {
  if (!email) return null
  return client().get(`users:${email.toLowerCase()}`)
}

export async function setUser(email, record) {
  await client().set(`users:${email.toLowerCase()}`, record)
}

export async function deleteUser(email) {
  await client().del(`users:${email.toLowerCase()}`)
}

/** Stream all users as {email, role} pairs (password hashes excluded). */
export async function listUsers() {
  // SCAN is the right primitive — keyspace may be small but we don't want to
  // block on KEYS. Returns up to a few hundred entries.
  const out = []
  let cursor = '0'
  do {
    const [next, batch] = await client().scan(cursor, { match: 'users:*', count: 200 })
    cursor = next
    if (batch.length) {
      const records = await client().mget(batch)
      for (let i = 0; i < batch.length; i++) {
        const key = batch[i]
        const rec = records[i]
        if (rec) {
          out.push({ email: key.slice('users:'.length), role: rec.role || 'user' })
        }
      }
    }
  } while (cursor !== '0' && cursor !== 0)
  return out
}

// ── Sessions ────────────────────────────────────────────────────────────

export async function getSession(token) {
  if (!token) return null
  return client().get(`sessions:${token}`)
}

export async function setSession(token, record, ttlSeconds) {
  // EX so abandoned sessions expire on their own.
  await client().set(`sessions:${token}`, record, { ex: ttlSeconds })
}

export async function deleteSession(token) {
  await client().del(`sessions:${token}`)
}
