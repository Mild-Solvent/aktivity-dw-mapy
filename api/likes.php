<?php
/**
 * GET /api/likes → every trail the signed-in user has liked, newest first.
 *
 * Drafts are filtered out for non-managers, matching /api/trails: a trail can
 * be liked while published and later moved back to draft, and that should not
 * leak it back into view.
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    badRequest('Metóda nie je podporovaná');
}

$user = require_role([ROLES['ADMIN'], ROLES['TRAILS_ADDER'], ROLES['USER']]);

try {
    $trails = list_liked_trails($user['email']);
} catch (Throwable $e) {
    error_log('[api/likes] list failed: ' . $e->getMessage());
    serverError('Nepodarilo sa načítať obľúbené trasy');
}

$manager = is_trail_manager($user['role']);
$visible = $manager
    ? $trails
    : array_values(array_filter($trails, static function (array $t): bool {
        return ($t['status'] ?? 'published') === 'published';
    }));

ok($visible);
