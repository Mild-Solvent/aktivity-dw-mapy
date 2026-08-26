<?php
/**
 * GET  /api/announcements           → published blog posts, ticker order (public)
 * GET  /api/announcements?ticker=1  → published posts picked for the ants (public)
 * GET  /api/announcements?all=1     → every post incl. hidden (admin only)
 * POST /api/announcements           → create (admin only)
 *
 * POST body: { kind, text, body, mediaUrl, linkUrl, active, inTicker }
 *   text is the title — required (it names the blog page and rides the ticker)
 *   body is the article shown on /novinky/<id> — optional, plain text
 *   kind 'image' → mediaUrl required, must live under /tracks/announcements/
 *                  (uploaded first via /api/upload with trailId "announcements")
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../_lib/announcements.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    $all = !empty($_GET['all']);
    if ($all) {
        require_role([ROLES['ADMIN']]);
    }
    try {
        ok(list_announcements(!$all, !$all && !empty($_GET['ticker'])));
    } catch (Throwable $e) {
        error_log('[api/announcements] list failed: ' . $e->getMessage());
        serverError('Nepodarilo sa načítať novinky');
    }
}

if ($method === 'POST') {
    $user = require_role([ROLES['ADMIN']]);

    try {
        $body = read_json_body();
    } catch (JsonException $e) {
        badRequest('Neplatný JSON');
    }

    $kind = (string) ($body['kind'] ?? 'text');
    if (!in_array($kind, ANNOUNCEMENT_KINDS, true)) {
        badRequest('Neplatný typ novinky');
    }

    $text     = trim((string) ($body['text'] ?? ''));
    $article  = trim((string) ($body['body'] ?? ''));
    $mediaUrl = trim((string) ($body['mediaUrl'] ?? ''));
    $linkUrl  = trim((string) ($body['linkUrl'] ?? ''));

    if ($text === '') {
        badRequest('Novinka musí mať názov');
    }
    if (mb_strlen($text) > 200) {
        badRequest('Názov novinky môže mať najviac 200 znakov');
    }
    if (mb_strlen($article) > ANNOUNCEMENT_BODY_MAX) {
        badRequest('Obsah novinky je príliš dlhý');
    }
    if ($kind === 'image') {
        // Same-origin path into the reserved storage folder only — never a
        // client-chosen absolute URL.
        if (!preg_match('#^/tracks/' . ANNOUNCEMENTS_STORAGE_ID . '/[A-Za-z0-9._%-]+$#', $mediaUrl)) {
            badRequest('Obrázková novinka musí mať nahraný obrázok');
        }
    } else {
        $mediaUrl = '';
    }
    if ($linkUrl !== '' && !preg_match('#^(https?://|/)#', $linkUrl)) {
        badRequest('Odkaz musí byť http(s) adresa alebo cesta začínajúca /');
    }
    if (mb_strlen($linkUrl) > 500) {
        badRequest('Odkaz je príliš dlhý');
    }

    try {
        $saved = create_announcement([
            'kind'      => $kind,
            'text'      => $text,
            'body'      => $article,
            'mediaUrl'  => $mediaUrl,
            'linkUrl'   => $linkUrl,
            'active'    => !array_key_exists('active', $body) || (bool) $body['active'],
            'inTicker'  => !array_key_exists('inTicker', $body) || (bool) $body['inTicker'],
            'createdBy' => $user['email'],
        ]);
        created($saved);
    } catch (Throwable $e) {
        error_log('[api/announcements] create failed: ' . $e->getMessage());
        serverError('Nepodarilo sa uložiť novinku');
    }
}

badRequest('Metóda nie je podporovaná');
