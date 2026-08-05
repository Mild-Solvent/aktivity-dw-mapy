<?php
/**
 * POST /api/auth/login
 *
 * Direct port of api/auth/login.js. Body: { email, password }.
 * Bootstrap admin can log in without a users row only if a password has
 * been bootstrapped; the common path requires a registered row.
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

if ($email === '' || $password === '') {
    badRequest('Chýba e-mail alebo heslo');
}

$record = get_user($email);
$valid = ($record && !empty($record['password_hash']))
    ? verify_password($password, $record['password_hash'])
    : false;

if (!$record || !$valid) {
    unauthorized('Nesprávny e-mail alebo heslo');
}

$role = effective_role($email, $record);
if (!$role) {
    unauthorized('Účet neexistuje');
}

$token = new_session_token();
set_session($token, $email, SESSION_TTL_SECONDS);
set_session_cookie($token);

ok(['email' => $email, 'role' => $role]);
