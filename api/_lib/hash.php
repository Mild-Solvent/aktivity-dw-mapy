<?php
/**
 * Password hashing + session token generation.
 *
 * Direct port of api/_lib/hash.js. Uses the Web Crypto PBKDF2/SHA-256
 * parameters from the Node app: 150 000 iterations, 16-byte salt,
 * 32-byte derived key. Hashes are stored as:
 *
 *   "pbkdf2$<iterations>$<base64-salt>$<base64-hash>"
 *
 * This is the SAME format the Node app wrote, so accounts migrated from
 * Redis verify byte-for-byte — no password resets.
 *
 * hash_pbkdf2('sha256', $pw, $salt, $iter, 0, true) returns raw 32 bytes
 * identical to crypto.subtle.deriveBits(..., 256).
 */

declare(strict_types=1);

const PBKDF2_ITERATIONS = 150_000;
const PBKDF2_KEY_LENGTH = 32;  // 256-bit
const PBKDF2_SALT_LENGTH = 16;

/**
 * Hash a password. Returns the self-describing
 *   "pbkdf2$<iterations>$<base64-salt>$<base64-hash>"
 */
function hash_password(string $password): string {
    $salt = random_bytes(PBKDF2_SALT_LENGTH);
    $hash = hash_pbkdf2('sha256', $password, $salt, PBKDF2_ITERATIONS, 0, true);
    return 'pbkdf2$' . PBKDF2_ITERATIONS . '$' . base64_encode($salt) . '$' . base64_encode($hash);
}

/**
 * Verify $password against a stored "pbkdf2$..." string. Constant-time
 * via hash_equals().
 */
function verify_password(string $password, string $stored): bool {
    $parts = explode('$', $stored);
    if (count($parts) !== 4 || $parts[0] !== 'pbkdf2') {
        return false;
    }
    $iterations = (int) $parts[1];
    $salt = base64_decode($parts[2], true);
    $expected = base64_decode($parts[3], true);
    if ($salt === false || $expected === false || $iterations <= 0 || $expected === '') {
        return false;
    }
    // Derive with the same byte length as the stored hash so older or
    // future hashes with different key widths still verify.
    $derived = hash_pbkdf2('sha256', $password, $salt, $iterations, strlen($expected), true);
    return hash_equals($expected, $derived);
}

/**
 * Cryptographically random session token — URL-safe base64 of 32 bytes
 * (≈43 chars). Matches newSessionToken() in Node.
 */
function new_session_token(): string {
    return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
}
