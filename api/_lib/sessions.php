<?php
/**
 * Session storage (replaces Redis sessions:<token> with TTL).
 *
 * Sessions live in the `sessions` table with an explicit expires_at.
 * Opportunistic cleanup runs on ~1% of writes — fine for this app's
 * traffic without needing a cron job.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function get_session(string $token): ?array {
    $stmt = db()->prepare(
        'SELECT email, created_at, expires_at FROM sessions
         WHERE token = :token AND expires_at > NOW()'
    );
    $stmt->execute([':token' => $token]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Insert a new session row. ~1% of calls also sweep expired rows.
 */
function set_session(string $token, string $email, int $ttlSeconds): void {
    $pdo = db();
    $pdo->prepare(
        'INSERT INTO sessions (token, email, expires_at)
         VALUES (:token, :email, DATE_ADD(NOW(), INTERVAL :ttl SECOND))'
    )->execute([
        ':token' => $token,
        ':email' => strtolower($email),
        ':ttl'   => $ttlSeconds,
    ]);
    // Opportunistic GC — keeps the table small without a cron task.
    if (mt_rand(1, 100) === 1) {
        $pdo->exec('DELETE FROM sessions WHERE expires_at <= NOW()');
    }
}

function delete_session(string $token): void {
    db()->prepare('DELETE FROM sessions WHERE token = :token')
        ->execute([':token' => $token]);
}
