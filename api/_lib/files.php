<?php
/**
 * Filesystem storage for binary uploads (replaces @vercel/blob).
 *
 * Files live under TRACKS_DIR/tracks/<slug>/<path>, e.g.
 *   tracks/inovec-mitice/track.gpx
 *   tracks/inovec-mitice/preview-1718....webp
 *   tracks/inovec-mitice/gallery-...-0.webp
 *
 * Apache serves them directly (no PHP in the hot path) because the folder
 * lives under the web docroot. Returned URLs are same-origin absolute
 * paths like "/tracks/<slug>/<path>".
 *
 * TRACKS_DIR is defined in private/config.php — the absolute filesystem
 * path to the docroot (e.g. /home/user/public_html). If unset, we derive
 * it from the API dir (../..).
 */

declare(strict_types=1);

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB hard cap, mirrors upload.js

/**
 * Same slug rules as storageTrailId() in api/_lib/blob.js (Node).
 */
function storage_trail_id(string $raw): string {
    $s = trim(strtolower((string) $raw));
    $s = normalizer_normalize($s, Normalizer::FORM_D);
    $s = preg_replace('/\p{M}/u', '', $s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s ?? '', '-');
}

function docroot(): string {
    if (defined('TRACKS_DIR')) return rtrim(TRACKS_DIR, '/\\');
    // Fallback for dev: two levels up from api/.
    return realpath(__DIR__ . '/../..');
}

/**
 * Sanitize the per-trail sub-path. Mirrors upload.js:110-113.
 * - No backslashes
 * - Only [a-z0-9._-/] allowed
 * - Trim leading/trailing slashes
 * - No ".." traversal
 */
function sanitize_upload_path(string $raw): string {
    $s = str_replace('\\', '/', $raw);
    $s = preg_replace('/[^a-zA-Z0-9._\-\/]/', '', $s);
    $s = preg_replace('/^\/+|\/+$/', '', $s);
    return $s;
}

/**
 * Save an uploaded file under tracks/<slug>/<path>. Returns the public
 * URL path (NOT including the host — frontend resolves it as same-origin).
 *
 * @return string  e.g. "/tracks/inovec-mitice/track.gpx"
 * @throws RuntimeException on size cap, bad path, or filesystem failure
 */
function upload_file(string $slug, string $subPath, string $bytes, string $contentType): string {
    if (strlen($bytes) > MAX_UPLOAD_BYTES) {
        throw new RuntimeException('Súbor presahuje limit ' . (MAX_UPLOAD_BYTES / 1024 / 1024) . ' MB');
    }
    $slug = storage_trail_id($slug);
    $subPath = sanitize_upload_path($subPath);
    if ($slug === '' || $subPath === '' || str_contains($subPath, '..')) {
        throw new RuntimeException('Neplatná cesta');
    }

    $root = docroot();
    $dir = $root . '/tracks/' . $slug;
    if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
        throw new RuntimeException('Nepodarilo sa vytvoriť priečinok');
    }

    $absPath = $dir . '/' . $subPath;
    // Final safety: ensure the resolved path stays under $dir.
    $realDir = realpath($dir);
    $realParent = realpath(dirname($absPath));
    if ($realDir === false || $realParent === false || !str_starts_with($realParent, $realDir)) {
        throw new RuntimeException('Neplatná cesta');
    }

    if (file_put_contents($absPath, $bytes) === false) {
        throw new RuntimeException('Nepodarilo sa zapísať súbor');
    }
    @chmod($absPath, 0664);

    return '/tracks/' . rawurlencode($slug) . '/' . implode('/', array_map('rawurlencode', explode('/', $subPath)));
}

/**
 * Recursively remove every file under tracks/<slug>/. Used on trail delete.
 * Returns the count of removed files.
 */
function delete_by_prefix(string $slug): int {
    $slug = storage_trail_id($slug);
    if ($slug === '') return 0;
    $dir = docroot() . '/tracks/' . $slug;
    if (!is_dir($dir)) return 0;

    $count = 0;
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $entry) {
        if ($entry->isDir()) {
            @rmdir($entry->getRealPath());
        } else {
            if (@unlink($entry->getRealPath())) $count++;
        }
    }
    @rmdir($dir);
    return $count;
}
