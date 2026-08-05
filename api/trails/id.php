<?php
/**
 * GET    /api/trails/<id>   → public read (drafts only for managers)
 * PUT    /api/trails/<id>   → create or update (trail managers only)
 * DELETE /api/trails/<id>   → remove trail + its files (trail managers only)
 *
 * Direct port of api/trails/[id].js. The id is slugified server-side so
 * "My Cool Trail" and "my-cool-trail" resolve to the same record — and
 * that slug is also the storage folder name under tracks/.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

// Extract <id> from the original URL. The rewrite passes it via REDIRECT_URL.
$src = $_SERVER['REDIRECT_URL'] ?? ($_SERVER['REQUEST_URI'] ?? '');
$src = preg_replace('/\?.*$/', '', $src);
if (preg_match('#/api/trails/(.+)$#', $src, $m)) {
    $idRaw = urldecode($m[1]);
} else {
    $idRaw = '';
}
$id = slugify($idRaw);

if ($id === '') {
    badRequest('Chýba id trasy');
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    $viewer = current_user();
    $trail = get_trail($id, $viewer['email'] ?? null);
    if (!$trail) notFound('Trasa nebola nájdená');
    ok($trail);
}

// All writes require trail-manager role.
$user = require_role([ROLES['ADMIN'], ROLES['TRAILS_ADDER']]);

if ($method === 'PUT') {
    try {
        $body = read_json_body();
    } catch (JsonException $e) {
        badRequest('Neplatný JSON');
    }
    if (empty($body['id'])) {
        badRequest('Trasa musí mať id');
    }
    // URL id is authoritative. If body id slugifies to something different,
    // reject — same slug is fine.
    if (slugify((string) $body['id']) !== $id) {
        badRequest('id v tele (' . slugify((string) $body['id']) . ') sa nezhoduje s URL (' . $id . ')');
    }

    $existedBefore = get_trail($id);

    $VALID_STATUS = ['published', 'draft'];
    $status = in_array($body['status'] ?? null, $VALID_STATUS, true) ? $body['status'] : 'published';

    $payload = sanitize_trail_payload(array_merge($body, [
        'id'        => $id,
        'status'    => $status,
        'updatedAt' => floor(microtime(true) * 1000),  // ms, matches Date.now() in Node
        'createdBy' => $body['createdBy'] ?? $user['email'],
    ]));

    try {
        $saved = save_trail($id, $payload);
        if ($existedBefore) ok($saved);
        created($saved);
    } catch (Throwable $e) {
        error_log('[api/trails] save failed: ' . $e->getMessage());
        serverError('Nepodarilo sa uložiť trasu');
    }
}

if ($method === 'DELETE') {
    $existing = get_trail($id);
    if (!$existing) notFound('Trasa nebola nájdená');
    try {
        delete_trail($id);
        // Likes reference the trail by id with no foreign key, so they would
        // otherwise survive it and be inherited by any future trail that
        // slugified to the same id.
        delete_trail_likes($id);
        // Clean up uploaded files under tracks/<slug>/.
        delete_by_prefix(storage_trail_id($id));
    } catch (Throwable $e) {
        error_log('[api/trails] delete failed: ' . $e->getMessage());
        serverError('Nepodarilo sa odstrániť trasu');
    }
    ok(['id' => $id, 'deleted' => true]);
}

badRequest('Metóda nie je podporovaná');
