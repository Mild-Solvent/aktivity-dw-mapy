<?php
/**
 * GET /api/roles
 *
 * Direct port of api/roles/index.js. Admin-only. Returns every user with
 * their role. The bootstrap admin (ADMIN_BOOTSTRAP_EMAIL) is always
 * included as 'admin' even without a users row.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

// require_role exits with 403 if not admin.
require_role([ROLES['ADMIN']]);

try {
    $users = list_users();
} catch (Throwable $e) {
    error_log('[api/roles] list failed: ' . $e->getMessage());
    serverError('Nepodarilo sa načítať role');
}

$bootstrap = bootstrap_email();

// Surface the bootstrap admin's effective role as 'admin' regardless of row.
$withEffective = array_map(static function (array $u) use ($bootstrap) {
    if ($u['email'] === $bootstrap) $u['role'] = 'admin';
    return $u;
}, $users);

// Make sure the bootstrap admin is in the list even if they never registered.
if ($bootstrap !== '' && !in_array($bootstrap, array_column($withEffective, 'email'), true)) {
    array_unshift($withEffective, ['email' => $bootstrap, 'role' => 'admin']);
}

ok(array_values($withEffective));
