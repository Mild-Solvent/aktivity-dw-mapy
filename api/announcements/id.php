<?php
/**
 * GET    /api/announcements/<id> → one blog post (public when published;
 *                                  hidden posts are visible to admins only)
 * PUT    /api/announcements/<id> → partial update: text, body, linkUrl,
 *                                  active, inTicker, sortOrder (admin only)
 * DELETE /api/announcements/<id> → remove; unlinks the uploaded image when no
 *                                  other announcement references it (admin only)
 *
 * kind and mediaUrl are deliberately not updatable — see _lib/announcements.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../_lib/announcements.php';

// Extract <id> from the original URL. The rewrite passes it via REDIRECT_URL.
$src = $_SERVER['REDIRECT_URL'] ?? ($_SERVER['REQUEST_URI'] ?? '');
$src = preg_replace('/\?.*$/', '', $src);
$id = 0;
if (preg_match('#/api/announcements/(\d+)$#', $src, $m)) {
    $id = (int) $m[1];
}
if ($id <= 0) {
    badRequest('Chýba id novinky');
}

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    $item = get_announcement($id);
    if ($item && !$item['active']) {
        // Hidden = draft: only an admin may preview it.
        $viewer = current_user();
        if (!$viewer || !is_admin($viewer['role'])) {
            $item = null;
        }
    }
    if (!$item) notFound('Novinka nebola nájdená');
    ok($item);
}

require_role([ROLES['ADMIN']]);

$existing = get_announcement($id);
if (!$existing) {
    notFound('Novinka nebola nájdená');
}

if ($method === 'PUT') {
    try {
        $body = read_json_body();
    } catch (JsonException $e) {
        badRequest('Neplatný JSON');
    }

    $fields = [];
    if (array_key_exists('text', $body)) {
        $text = trim((string) $body['text']);
        if ($text === '') {
            badRequest('Novinka musí mať názov');
        }
        if (mb_strlen($text) > 200) {
            badRequest('Názov novinky môže mať najviac 200 znakov');
        }
        $fields['text'] = $text;
    }
    if (array_key_exists('body', $body)) {
        $article = trim((string) $body['body']);
        if (mb_strlen($article) > ANNOUNCEMENT_BODY_MAX) {
            badRequest('Obsah novinky je príliš dlhý');
        }
        $fields['body'] = $article;
    }
    if (array_key_exists('linkUrl', $body)) {
        $link = trim((string) $body['linkUrl']);
        if ($link !== '' && !preg_match('#^(https?://|/)#', $link)) {
            badRequest('Odkaz musí byť http(s) adresa alebo cesta začínajúca /');
        }
        if (mb_strlen($link) > 500) {
            badRequest('Odkaz je príliš dlhý');
        }
        $fields['linkUrl'] = $link;
    }
    if (array_key_exists('active', $body)) {
        $fields['active'] = (bool) $body['active'];
    }
    if (array_key_exists('inTicker', $body)) {
        $fields['inTicker'] = (bool) $body['inTicker'];
    }
    if (array_key_exists('sortOrder', $body)) {
        if (!is_numeric($body['sortOrder'])) {
            badRequest('Neplatné poradie');
        }
        $fields['sortOrder'] = (int) $body['sortOrder'];
    }

    try {
        update_announcement($id, $fields);
        ok(get_announcement($id));
    } catch (Throwable $e) {
        error_log('[api/announcements] update failed: ' . $e->getMessage());
        serverError('Nepodarilo sa upraviť novinku');
    }
}

if ($method === 'DELETE') {
    try {
        delete_announcement($id);
        $mediaUrl = $existing['mediaUrl'];
        if ($mediaUrl !== '' && !announcement_media_in_use($mediaUrl, $id)) {
            // basename() strips any path games; the file can only be directly
            // inside the reserved folder, matching what index.php accepted.
            $file = docroot() . '/tracks/' . ANNOUNCEMENTS_STORAGE_ID . '/'
                  . basename(rawurldecode($mediaUrl));
            if (is_file($file)) {
                @unlink($file);
            }
        }
    } catch (Throwable $e) {
        error_log('[api/announcements] delete failed: ' . $e->getMessage());
        serverError('Nepodarilo sa odstrániť novinku');
    }
    ok(['id' => $id, 'deleted' => true]);
}

badRequest('Metóda nie je podporovaná');
