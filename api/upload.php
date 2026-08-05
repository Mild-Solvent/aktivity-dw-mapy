<?php
/**
 * POST /api/upload
 *
 * Direct port of api/upload.js. Multipart form:
 *   file        — the binary to store (required)
 *   path        — sub-path under tracks/<id>/, e.g. "track.gpx" or
 *                 "preview-1718....webp" or "gallery-...-0.webp" (required)
 *   trailId     — the trail slug (required; normalized server-side)
 *   contentType — MIME override (optional; falls back to the upload's type)
 *
 * Returns: { url, pathname } — same-origin URL path + the canonical path.
 *
 * Only trail managers can upload. Files live under tracks/<slug>/<path> and
 * are served directly by Apache.
 *
 * Implementation note: unlike the Node app which had to manually buffer the
 * raw multipart body (a quirk of @vercel/node's socket handling), here we
 * use PHP's standard $_FILES. The .user.ini bumps upload_max_filesize +
 * post_max_size to 26M to honor the 25 MB cap.
 */

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    badRequest('Metóda nie je podporovaná');
}

// Trail managers only. require_role exits on failure.
require_role([ROLES['ADMIN'], ROLES['TRAILS_ADDER']]);

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (!str_starts_with($contentType, 'multipart/form-data')) {
    badRequest('Očakáva sa multipart/form-data');
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
    badRequest('Chýba súbor');
}
if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    if ($_FILES['file']['error'] === UPLOAD_ERR_INI_SIZE || $_FILES['file']['error'] === UPLOAD_ERR_FORM_SIZE) {
        badRequest('Súbor presahuje limit ' . (MAX_UPLOAD_BYTES / 1024 / 1024) . ' MB');
    }
    serverError('Nepodarilo sa prijať súbor');
}

if (empty($_POST['trailId'])) badRequest('Chýba trailId');
if (empty($_POST['path']))    badRequest('Chýba cesta súboru');

if ($_FILES['file']['size'] > MAX_UPLOAD_BYTES) {
    badRequest('Súbor presahuje limit ' . (MAX_UPLOAD_BYTES / 1024 / 1024) . ' MB');
}

$slug = storage_trail_id((string) $_POST['trailId']);
$safePath = sanitize_upload_path((string) $_POST['path']);
if ($safePath === '' || str_contains($safePath, '..')) {
    badRequest('Neplatná cesta');
}

$bytes = file_get_contents($_FILES['file']['tmp_name']);
if ($bytes === false) {
    serverError('Nepodarilo sa prečítať nahraný súbor');
}

$finalContentType = (string) ($_POST['contentType'] ?? ($_FILES['file']['type'] ?? 'application/octet-stream'));

try {
    $url = upload_file($slug, $safePath, $bytes, $finalContentType);
    ok([
        'url'      => $url,
        'pathname' => 'tracks/' . $slug . '/' . $safePath,
    ]);
} catch (Throwable $e) {
    error_log('[api/upload] put failed: ' . $e->getMessage());
    $msg = $e->getMessage();
    if (str_contains($msg, 'limit')) {
        badRequest($msg);
    }
    serverError('Nepodarilo sa nahrať súbor');
}
