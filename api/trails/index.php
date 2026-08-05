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

// Resolved before the query so the like join can mark which trails this
// viewer has already liked.
$user = current_user();

try {
    $trails = list_trails($user['email'] ?? null);
} catch (Throwable $e) {
    error_log('[api/trails] list failed: ' . $e->getMessage());
    serverError('Nepodarilo sa načítať trasy');
}

$manager = $user && is_trail_manager($user['role']);

$visible = $manager
    ? $trails
    : array_values(array_filter($trails, static function (array $t): bool {
        return ($t['status'] ?? 'published') === 'published';
    }));

ok($visible);
