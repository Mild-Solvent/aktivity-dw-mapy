<?php
/**
 * GET /api/trails
 *
 * Direct port of api/trails/index.js. Anonymous / regular users see only
 * status='published'; trail managers (admin / trails_adder) also see drafts.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    ok([]);
}

try {
    $trails = list_trails();
} catch (Throwable $e) {
    error_log('[api/trails] list failed: ' . $e->getMessage());
    serverError('Nepodarilo sa načítať trasy');
}

$user = current_user();
$manager = $user && is_trail_manager($user['role']);

$visible = $manager
    ? $trails
    : array_values(array_filter($trails, static function (array $t): bool {
        return ($t['status'] ?? 'published') === 'published';
    }));

ok($visible);
