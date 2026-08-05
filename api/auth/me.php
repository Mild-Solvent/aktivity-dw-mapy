<?php
/**
 * GET /api/auth/me
 *
 * Returns the currently logged-in user's public profile, or 401 if anonymous.
 * The SPA calls this on mount (App.vue bootstrapSession).
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    unauthorized('Metóda nie je podporovaná');
}

$user = current_user();
if (!$user) {
    unauthorized('Neprihlásený');
}

ok(['email' => $user['email'], 'role' => $user['role']]);
