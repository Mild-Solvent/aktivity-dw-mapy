<?php
/**
 * POST /api/auth/reset-password  {token, password}
 *
 * Redeems a token from forgot-password.php and sets a new password.
 *
 * Two things here are easy to get wrong and both are load-bearing:
 *
 * 1. set_user() is a FULL upsert with no partial-update variant, so the
 *    existing role has to be read and re-passed. Forgetting it silently
 *    demotes an admin to 'user' on their own password reset.
 * 2. Every session for the account is revoked. Someone who stole a session is
 *    otherwise still inside precisely when the owner is trying to lock them out.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../_lib/password_reset.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    badRequest('Metóda nie je podporovaná');
}

try {
    $body = read_json_body();
} catch (JsonException $e) {
    badRequest('Neplatný JSON');
}

$token    = trim((string) ($body['token'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($token === '') {
    badRequest('Chýba token');
}
if (strlen($password) < 8) {
    badRequest('Heslo musí mať aspoň 8 znakov');
}

// Marks the token spent as it reads it, so a replay finds nothing.
$reset = consume_reset_token($token);
if (!$reset) {
    badRequest('Odkaz je neplatný alebo mu vypršala platnosť. Požiadajte o nový.');
}

$email    = strtolower(trim($reset['email']));
$existing = get_user($email);

if (!$existing) {
    // The account went away between request and redemption.
    badRequest('Účet už neexistuje.');
}

try {
    set_user($email, [
        'password_hash' => hash_password($password),
        // Re-passed deliberately — see the header note.
        'role'          => $existing['role'] ?? ROLES['USER'],
    ]);

    // Any other outstanding link for this address is now void.
    invalidate_reset_tokens($email);

    // Log out everywhere, including whoever may have had the account.
    delete_sessions_for_email($email);
} catch (Throwable $e) {
    error_log('[api/auth/reset-password] failed for ' . $email . ': ' . $e->getMessage());
    serverError('Nepodarilo sa zmeniť heslo');
}

ok(['message' => 'Heslo bolo zmenené. Teraz sa môžete prihlásiť.']);
