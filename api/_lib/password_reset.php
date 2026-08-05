<?php
/**
 * Password-reset tokens.
 *
 * Design notes worth keeping:
 *
 * - Only sha256(token) is stored. Reading the table gives an attacker nothing
 *   usable, the same reason session tokens are compared rather than trusted.
 * - Tokens are single use (used_at) and short-lived (RESET_TTL_SECONDS).
 * - The table doubles as the rate-limit ledger. Rows are written even for
 *   addresses with no account, so a flood is counted whether or not it happens
 *   to name a real user — otherwise the limiter itself leaks which addresses
 *   exist.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/hash.php';

const RESET_TTL_SECONDS   = 60 * 60;  // 1 hour
const RESET_MAX_PER_EMAIL = 3;        // per hour
const RESET_MAX_PER_IP    = 10;       // per hour

function reset_token_hash(string $token): string {
    return hash('sha256', $token);
}

/** Client IP, trusting the proxy header the site actually sits behind. */
function request_ip(): ?string {
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        // Left-most entry is the original client.
        $first = trim(explode(',', $forwarded)[0]);
        if ($first !== '') return substr($first, 0, 45);
    }
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    return $remote !== '' ? substr($remote, 0, 45) : null;
}

/**
 * True when this email or IP has asked too often in the last hour.
 * Checked before any mail is sent.
 */
function reset_rate_limited(string $email, ?string $ip): bool {
    $pdo = db();

    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM password_resets
          WHERE email = :email AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    );
    $stmt->execute([':email' => strtolower(trim($email))]);
    if ((int) $stmt->fetchColumn() >= RESET_MAX_PER_EMAIL) return true;

    if ($ip !== null) {
        $stmt = $pdo->prepare(
            'SELECT COUNT(*) FROM password_resets
              WHERE requested_ip = :ip AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
        );
        $stmt->execute([':ip' => $ip]);
        if ((int) $stmt->fetchColumn() >= RESET_MAX_PER_IP) return true;
    }

    return false;
}

/**
 * Record a reset request. Called for unknown addresses too (with $email as
 * given) so the rate limiter sees every attempt.
 *
 * @return string the raw token — the only moment it exists in plaintext
 */
function create_reset_token(string $email, ?string $ip): string {
    $token = new_session_token();
    db()->prepare(
        'INSERT INTO password_resets (token_hash, email, requested_ip, expires_at)
         VALUES (:hash, :email, :ip, DATE_ADD(NOW(), INTERVAL :ttl SECOND))'
    )->execute([
        ':hash'  => reset_token_hash($token),
        ':email' => strtolower(trim($email)),
        ':ip'    => $ip,
        ':ttl'   => RESET_TTL_SECONDS,
    ]);

    // Opportunistic GC, same approach as sessions — no cron needed at this size.
    if (mt_rand(1, 20) === 1) {
        db()->exec('DELETE FROM password_resets WHERE expires_at <= DATE_SUB(NOW(), INTERVAL 7 DAY)');
    }

    return $token;
}

/**
 * Look up an unused, unexpired token.
 * @return array|null ['email' => …] or null when invalid/expired/spent
 */
function consume_reset_token(string $token): ?array {
    $stmt = db()->prepare(
        'SELECT token_hash, email FROM password_resets
          WHERE token_hash = :hash AND used_at IS NULL AND expires_at > NOW()'
    );
    $stmt->execute([':hash' => reset_token_hash($token)]);
    $row = $stmt->fetch();
    if (!$row) return null;

    // Mark spent immediately. The UPDATE is conditional on used_at still being
    // NULL so two simultaneous redemptions cannot both win.
    $upd = db()->prepare(
        'UPDATE password_resets SET used_at = NOW()
          WHERE token_hash = :hash AND used_at IS NULL'
    );
    $upd->execute([':hash' => $row['token_hash']]);
    if ($upd->rowCount() === 0) return null;

    return ['email' => $row['email']];
}

/** Invalidate any other outstanding tokens for an address. */
function invalidate_reset_tokens(string $email): void {
    db()->prepare(
        'UPDATE password_resets SET used_at = NOW()
          WHERE email = :email AND used_at IS NULL'
    )->execute([':email' => strtolower(trim($email))]);
}
