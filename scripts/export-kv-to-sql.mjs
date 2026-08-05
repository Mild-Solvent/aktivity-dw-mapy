// One-time migration: Upstash Redis → MariaDB SQL + tracks/ directory.
//
// Run from the repo root with .env.local loaded, e.g.:
//
//   node --env-file=.env.local scripts/export-kv-to-sql.mjs
//
// Outputs (in repo root, gitignored):
//   migrate.sql            — INSERT statements for trails + users tables
//   migration-tracks/      — downloaded GPX/WebP files (SFTP this to Websupport)
//
// Passwords are NOT rehashed — the "pbkdf2$..." string is copied verbatim
// so users keep logging in with the same password after the move.
//
// Sessions are skipped: tokens are client-bound and would be invalid on a
// new origin anyway; users just log in again once.
//
// After successful import + SFTP upload, delete this script and the outputs.

import { Redis } from '@upstash/redis'
import { list } from '@vercel/blob'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { createWriteStream } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) {
  console.error('✗ KV_REST_API_URL / KV_REST_API_TOKEN missing. Run with --env-file=.env.local')
  process.exit(1)
}

const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
if (!hasBlob) {
  console.warn('⚠ BLOB_READ_WRITE_TOKEN not set — file download will be skipped.')
}

const redis = new Redis({ url, token })

// ── Helpers ─────────────────────────────────────────────────────────────

function sqlEscape(str) {
  // Single-quote escaping per MySQL string literal rules.
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function sqlString(str) {
  return `'${sqlEscape(str)}'`
}

async function scanKeys(match) {
  const out = []
  let cursor = '0'
  do {
    const [next, batch] = await redis.scan(cursor, { match, count: 200 })
    cursor = next
    if (batch.length) out.push(...batch)
  } while (cursor !== '0' && cursor !== 0)
  return out
}

// ── Trails ──────────────────────────────────────────────────────────────

async function exportTrails() {
  const ids = await redis.get('trails:index')
  if (!Array.isArray(ids) || ids.length === 0) {
    console.log('  no trails:index → 0 trails')
    return []
  }
  const payloads = await redis.mget(ids.map((id) => `trails:${id}`))
  const lines = []
  for (let i = 0; i < ids.length; i++) {
    const p = payloads[i]
    if (!p) continue
    const id = ids[i]
    const payloadJson = JSON.stringify({ ...p, id })
    const createdBy = p.createdBy ? sqlString(String(p.createdBy)) : 'NULL'
    lines.push(
      `INSERT INTO trails (id, payload, created_by) VALUES (${sqlString(id)}, ${sqlString(payloadJson)}, ${createdBy});`
    )
  }
  console.log(`  trails: ${lines.length}`)
  return lines
}

// ── Users ───────────────────────────────────────────────────────────────

async function exportUsers() {
  const keys = await scanKeys('users:*')
  if (!keys.length) {
    console.log('  users: 0')
    return []
  }
  const records = await redis.mget(keys)
  const lines = []
  for (let i = 0; i < keys.length; i++) {
    const rec = records[i]
    if (!rec) continue
    const email = keys[i].slice('users:'.length)
    const hash = rec.passwordHash || ''
    const role = ['admin', 'trails_adder', 'user'].includes(rec.role) ? rec.role : 'user'
    lines.push(
      `INSERT INTO users (email, password_hash, role) VALUES (${sqlString(email)}, ${sqlString(hash)}, ${sqlString(role)});`
    )
  }
  console.log(`  users: ${lines.length}`)
  return lines
}

// ── Files (Vercel Blob → migration-tracks/) ─────────────────────────────

async function exportFiles() {
  if (!hasBlob) {
    console.log('  files: skipped (no BLOB_READ_WRITE_TOKEN)')
    return { count: 0, skipped: true }
  }
  const out = []
  let cursor
  do {
    const result = await list({ prefix: 'tracks/', cursor })
    cursor = result.cursor
    out.push(...result.blobs)
  } while (cursor && !cursor.endsWith('undefined'))

  let count = 0
  for (const blob of out) {
    // Each blob has a URL like
    //   https://public.blob.vercel-storage.com/tracks/<slug>/<path>?...
    // We want to mirror it under migration-tracks/<slug>/<path>.
    const u = new URL(blob.url)
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '')  // "tracks/<slug>/<path>"
    if (!rel.startsWith('tracks/')) {
      console.warn(`  skip unexpected path: ${rel}`)
      continue
    }
    const target = join(process.cwd(), 'migration-tracks', rel.slice('tracks/'.length))
    await mkdir(dirname(target), { recursive: true })
    const res = await fetch(blob.url)
    if (!res.ok) {
      console.warn(`  ✗ ${rel}: HTTP ${res.status}`)
      continue
    }
    await pipeline(Readable.fromWeb(res.body), createWriteStream(target))
    count++
    if (count % 10 === 0) console.log(`    …${count} downloaded`)
  }
  console.log(`  files: ${count} downloaded → migration-tracks/`)
  return { count }
}

// ── Main ────────────────────────────────────────────────────────────────

console.log('Exporting from Upstash Redis → migrate.sql + migration-tracks/')
console.log(`  endpoint: ${url}`)

const sql = []
sql.push('-- Auto-generated by scripts/export-kv-to-sql.mjs')
sql.push('-- Import via phpMyAdmin on Websupport after running migrations/001_init.sql.')
sql.push('')
sql.push('START TRANSACTION;')
sql.push('')
sql.push('-- Trails')
sql.push(...(await exportTrails()))
sql.push('')
sql.push('-- Users (password hashes preserved verbatim)')
sql.push(...(await exportUsers()))
sql.push('')
sql.push('COMMIT;')
sql.push('')

await writeFile(join(process.cwd(), 'migrate.sql'), sql.join('\n'), 'utf8')
console.log(`✓ migrate.sql written (${sql.length} lines)`)

await exportFiles()

console.log('')
console.log('Next steps:')
console.log('  1. Import migrations/001_init.sql into MariaDB (phpMyAdmin → SQL tab).')
console.log('  2. Import migrate.sql the same way.')
console.log('  3. SFTP migration-tracks/* to <docroot>/tracks/ on Websupport.')
console.log('  4. Delete migrate.sql, migration-tracks/, and this script.')
