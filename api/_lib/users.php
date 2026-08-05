<?php
/**
 * Users table access (replaces Redis users:<email>).
 *
 * Records look like: { email, password_hash, role, created_at, updated_at }.
 * The password_hash column stores the verbatim "pbkdf2$..." string.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

/** Return the raw user row (incl. password_hash) or null. */
function get_user(string $email): ?array {
    if ($email === '') return null;
    $stmt = db()->prepare(
        'SELECT email, password_hash, role, created_at, updated_at
         FROM users WHERE email = :email'
    );
    $stmt->execute([':email' => strtolower(trim($email))]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * Upsert a user record. Accepts the same shape the Node app wrote.
 *
 * @param array $record {password_hash, role, created_at?, updated_at?}
 */
function set_user(string $email, array $record): void {
    $email = strtolower(trim($email));
    $pdo = db();
    $stmt = $pdo->prepare(
        'INSERT INTO users (email, password_hash, role, created_at, updated_at)
         VALUES (:email, :ph, :role, NOW(), NULL)
         ON DUPLICATE KEY UPDATE
           password_hash = VALUES(password_hash),
           role          = VALUES(role),
           updated_at    = :updated'
    );
    $stmt->execute([
        ':email'   => $email,
        ':ph'      => $record['password_hash'] ?? '',
        ':role'    => $record['role'] ?? 'user',
        // On insert updated_at is NULL; on update set to NOW().
        ':updated' => date('Y-m-d H:i:s'),
    ]);
}

function delete_user(string $email): void {
    db()->prepare('DELETE FROM users WHERE email = :email')
        ->execute([':email' => strtolower(trim($email))]);
}

/**
 * Stream every user as ['email' => …, 'role' => …]. Password hashes are
 * NOT included. Mirrors listUsers() in kv.js.
 */
function list_users(): array {
    $stmt = db()->query('SELECT email, role FROM users ORDER BY email');
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $out[] = ['email' => $row['email'], 'role' => $row['role'] ?: 'user'];
    }
    return $out;
}
