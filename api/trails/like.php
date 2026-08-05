<?php
/**
 * PUT    /api/trails/<id>/like   → like a trail
 * DELETE /api/trails/<id>/like   → remove your like
 *
 * Any signed-in role may like; this is the one write ordinary users have.
 * Both verbs are idempotent (INSERT IGNORE / DELETE), so a double-tap or a
 * retried request cannot double-count — the composite primary key on
 * trail_likes is what actually guarantees that.
 *
 * Returns the fresh count so the caller never has to re-fetch the list.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

// Same path-segment idiom as id.php / email.php: the rewrite is invisible to
// PHP, so the id comes back out of the original URL.
$src = $_SERVER['REDIRECT_URL'] ?? ($_SERVER['REQUEST_URI'] ?? '');
$src = preg_replace('/\?.*$/', '', $src);
if (preg_match('#/api/trails/([^/]+)/like$#', $src, $m)) {
    $idRaw = urldecode($m[1]);
} else {
    $idRaw = '';
}
$id = slugify($idRaw);

if ($id === '') {
    badRequest('Chýba id trasy');
}

$user = require_role([ROLES['ADMIN'], ROLES['TRAILS_ADDER'], ROLES['USER']]);

// Liking something that does not exist would leave an orphan row that a later
// trail with the same slug would inherit.
if (!get_trail($id)) {
    notFound('Trasa nebola nájdená');
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method !== 'PUT' && $method !== 'DELETE') {
    badRequest('Metóda nie je podporovaná');
}

try {
    if ($method === 'PUT') {
        like_trail($id, $user['email']);
    } else {
        unlike_trail($id, $user['email']);
    }
} catch (Throwable $e) {
    error_log('[api/trails/like] failed: ' . $e->getMessage());
    serverError('Nepodarilo sa uložiť hodnotenie');
}

ok([
    'id'        => $id,
    'likeCount' => count_trail_likes($id),
    'likedByMe' => $method === 'PUT',
]);
