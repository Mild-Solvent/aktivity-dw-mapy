// Vercel Blob access layer.
//
// Used for binary assets only: GPX track files, preview images, gallery photos.
// Path layout mirrors the old Supabase buckets:
//   tracks/<slug>/track.gpx
//   tracks/<slug>/preview-<ts>.webp
//   tracks/<slug>/gallery-<ts>-<n>.webp
//
// BLOB_READ_WRITE_TOKEN is auto-injected when a Blob store is attached in the
// Vercel dashboard. Reads via public CDN URLs returned by put()/list().

import { put, head, list, del } from '@vercel/blob'

export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/**
 * Store a binary payload. Returns the public Blob URL to persist in a trail.
 * @param {string} pathname e.g. "tracks/inovec-mitice/track.gpx"
 * @param {Buffer|ArrayBuffer|ReadableStream} body
 * @param {string} contentType MIME type
 */
export async function uploadBlob(pathname, body, contentType) {
  const result = await put(pathname, body, {
    access: 'public',
    contentType,
    addRandomSuffix: false, // we manage our own versioned paths
  })
  return result.url
}

/** Does a blob at this pathname exist? Returns the public URL or null. */
export async function findBlob(pathname) {
  try {
    const result = await head(pathname)
    return result?.url ?? null
  } catch {
    return null
  }
}

/** List all blobs under a prefix, e.g. listBlobs('tracks/inovec-mitice/'). */
export async function listBlobs(prefix) {
  const out = []
  let cursor
  do {
    const result = await list({ prefix, cursor })
    cursor = result.cursor
    out.push(...result.blobs)
  } while (cursor && !cursor.endsWith('undefined'))
  return out
}

/** Recursively delete every blob under a prefix (used on trail delete). */
export async function deleteBlobsByPrefix(prefix) {
  const blobs = await listBlobs(prefix)
  if (!blobs.length) return 0
  await del(blobs.map((b) => b.url))
  return blobs.length
}

/**
 * Storage-safe trail id, mirroring getStorageTrailId() in the Vue app.
 * Lowercase, non-alphanumerics → '-'.
 */
export function storageTrailId(raw) {
  return String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip Slovak diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
