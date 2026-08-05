<?php
/**
 * POST /api/auth/logout
 *
 * Clears the session cookie and deletes the session row. Idempotent —
 * calling it while logged out still returns 200.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    ok(['ok' => true]);
}

$user = current_user();
if ($user && !empty($user['token'])) {
    delete_session($user['token']);
}
clear_session_cookie();
ok(['ok' => true]);
