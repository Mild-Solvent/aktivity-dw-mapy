<?php
/**
 * PUT    /api/roles/<email>   body: { role }   → set role (admin only)
 * DELETE /api/roles/<email>                     → demote to 'user' (admin only)
 *
 * Direct port of api/roles/[email].js. The .htaccess rule passes the email
 * via the REDIRECT_URL env var; we extract it from REQUEST_URI to be safe.
 *
 * The bootstrap admin cannot be demoted or removed — the env var is the
 * source of truth and always wins.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

require_role([ROLES['ADMIN']]);

// Reconstruct the email from the original request URI. With the rewrite
//   RewriteRule ^api/roles/(.+)$ api/roles/email.php [L]
// Apache strips the prefix; the captured value lives in REDIRECT_URL.
$src = $_SERVER['REDIRECT_URL'] ?? ($_SERVER['REQUEST_URI'] ?? '');
// Strip query string if any.
$src = preg_replace('/\?.*$/', '', $src);
// Take everything after the last "/api/roles/".
if (preg_match('#/api/roles/(.+)$#', $src, $m)) {
    $email = urldecode($m[1]);
} else {
    $email = '';
}
$email = strtolower(trim($email));

if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
    badRequest('Neplatný e-mail');
}

$bootstrap = bootstrap_email();
if ($email === $bootstrap) {
    forbidden('Boostrap admin nie je možné zmeniť');
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'PUT') {
    try {
        $body = read_json_body();
    } catch (JsonException $e) {
        badRequest('Neplatný JSON');
    }
    $role = strtolower(trim((string) ($body['role'] ?? '')));
    if (!in_array($role, [ROLES['ADMIN'], ROLES['TRAILS_ADDER'], ROLES['USER']], true)) {
        badRequest('Neplatná rola');
    }

    try {
        $record = get_user($email);
        if (!$record) notFound('Používateľ neexistuje');

        // Preserve the password hash; only update role + updatedAt.
        set_user($email, [
            'password_hash' => $record['password_hash'],
            'role'          => $role,
        ]);
        ok(['email' => $email, 'role' => $role]);
    } catch (Throwable $e) {
        error_log('[api/roles] set failed: ' . $e->getMessage());
        serverError('Nepodarilo sa uložiť rolu');
    }
}

if ($method === 'DELETE') {
    try {
        $record = get_user($email);
        if (!$record) notFound('Používateľ neexistuje');

        // Don't lose the password — keep the row, demote to 'user'.
        set_user($email, [
            'password_hash' => $record['password_hash'],
            'role'          => ROLES['USER'],
        ]);
        ok(['email' => $email, 'role' => ROLES['USER']]);
    } catch (Throwable $e) {
        error_log('[api/roles] delete failed: ' . $e->getMessage());
        serverError('Nepodarilo sa odstrániť rolu');
    }
}

badRequest('Metóda nie je podporovaná');
