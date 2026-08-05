<?php
/**
 * POST /api/auth/change-password  {currentPassword, newPassword}
 *
 * For a user who knows their password and simply wants a different one.
 *
 * Unlike the reset flow this keeps the caller signed in: their own session is
 * spared and every OTHER session is revoked. Changing your password should
 * evict other devices, not the tab you are typing in.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../_lib/password_reset.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    badRequest('Metóda nie je podporovaná');
}

$user = require_role([ROLES['ADMIN'], ROLES['TRAILS_ADDER'], ROLES['USER']]);

try {
    $body = read_json_body();
} catch (JsonException $e) {
    badRequest('Neplatný JSON');
}

$current = (string) ($body['currentPassword'] ?? '');
$next    = (string) ($body['newPassword'] ?? '');

if ($current === '') {
    badRequest('Zadajte súčasné heslo');
}
if (strlen($next) < 8) {
    badRequest('Nové heslo musí mať aspoň 8 znakov');
}
if ($current === $next) {
    badRequest('Nové heslo sa musí líšiť od súčasného');
}

$email    = $user['email'];
$existing = get_user($email);

// The bootstrap admin is an admin by configuration and may have no row at all;
// without a stored hash there is no current password to verify against.
if (!$existing || ($existing['password_hash'] ?? '') === '') {
    badRequest('Pre tento účet nie je nastavené heslo');
}

if (!verify_password($current, $existing['password_hash'])) {
    unauthorized('Súčasné heslo je nesprávne');
}

try {
    set_user($email, [
        'password_hash' => hash_password($next),
        // Full upsert — the role must be carried over explicitly.
        'role'          => $existing['role'] ?? ROLES['USER'],
    ]);

    // A pending reset link should not outlive a deliberate change.
    invalidate_reset_tokens($email);

    // Everything except this browser.
    $revoked = delete_sessions_for_email($email, $user['token']);
} catch (Throwable $e) {
    error_log('[api/auth/change-password] failed for ' . $email . ': ' . $e->getMessage());
    serverError('Nepodarilo sa zmeniť heslo');
}

ok([
    'message'          => 'Heslo bolo zmenené.',
    'revokedSessions'  => $revoked,
]);
