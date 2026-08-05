<?php
/**
 * POST /api/auth/register
 *
 * Direct port of api/auth/register.js. Self-registration is open; new
 * accounts default to role 'user'. Bootstrap admin (ADMIN_BOOTSTRAP_EMAIL)
 * is always 'admin' regardless of any row. Auto-logs-in.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    badRequest('Metóda nie je podporovaná');
}

try {
    $body = read_json_body();
} catch (JsonException $e) {
    badRequest('Neplatný JSON');
}

$email = strtolower(trim((string) ($body['email'] ?? '')));
$password = (string) ($body['password'] ?? '');

if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
    badRequest('Neplatný e-mail');
}
if (strlen($password) < 8) {
    badRequest('Heslo musí mať aspoň 8 znakov');
}

$bootstrap = bootstrap_email();
$existing = get_user($email);
if ($existing && $email !== $bootstrap) {
    conflict('Účet s týmto e-mailom už existuje');
}

$passwordHash = hash_password($password);
set_user($email, [
    'password_hash' => $passwordHash,
    'role'          => ROLES['USER'],
]);

// Auto-login: mint a session and set the cookie.
$token = new_session_token();
set_session($token, $email, SESSION_TTL_SECONDS);
set_session_cookie($token);

$role = ($email === $bootstrap) ? ROLES['ADMIN'] : ROLES['USER'];
created(['email' => $email, 'role' => $role]);
