// Password hashing + session token generation using the Web Crypto API.
// Zero external dependencies — runs in Node 18+ Serverless (globalThis.crypto).
//
// PBKDF2 with SHA-256, 150k iterations. Parameters are stored alongside each
// hash so we can raise iterations later without invalidating old passwords.

const ITERATIONS = 150_000
const KEY_LENGTH = 32 // 256-bit derived key

function b64(buf) {
  // Buffer is available in Node Serverless runtime.
  return Buffer.from(buf).toString('base64')
}

function fromB64(str) {
  return Buffer.from(str, 'base64')
}

function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n))
}

/**
 * Hash a password. Returns a self-describing string:
 *   "pbkdf2$<iterations>$<base64-salt>$<base64-hash>"
 */
export async function hashPassword(password) {
  const salt = randomBytes(16)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8
  )
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(bits)}`
}

/** Verify a password against a string produced by hashPassword(). */
export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = Number(parts[1])
  const salt = fromB64(parts[2])
  const expected = fromB64(parts[3])
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    expected.byteLength * 8
  )
  // Constant-time compare.
  const got = new Uint8Array(bits)
  let diff = got.length ^ expected.length
  for (let i = 0; i < got.length && i < expected.length; i++) {
    diff |= got[i] ^ expected[i]
  }
  return diff === 0
}

/** Cryptographically random session token (URL-safe, 43 chars ≈ 256 bits). */
export function newSessionToken() {
  return Buffer.from(randomBytes(32)).toString('base64url')
}
