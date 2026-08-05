<?php
/**
 * Shared bootstrap for every /api/*.php handler.
 *
 * Loaded via require_once at the top of each endpoint. Sets up:
 *   - error → exception conversion (so throws become JSON 500s, not HTML)
 *   - JSON-only request parsing helper
 *   - config from private/config.php (DB creds, ADMIN_BOOTSTRAP_EMAIL, etc.)
 *   - PDO singleton via _lib/db.php
 *
 * Handlers should never call header()/echo directly for normal responses —
 * go through _lib/response.php helpers (ok(), badRequest(), …) instead.
 */

declare(strict_types=1);

// Server-side errors must come back as JSON, never as Apache's default HTML.
ini_set('display_errors', '0');
error_reporting(E_ALL);
set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    // Respect @-suppression.
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});
set_exception_handler(static function (Throwable $e): void {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    error_log('[api] unhandled error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Interná chyba servera']);
});

// Strict JSON content type for every response (handlers can override if needed).
header('Content-Type: application/json; charset=utf-8');

// Load secrets + DB config. private/ lives outside the web docroot on Websupport
// (or in an .htaccess-deny folder) so it's never directly fetchable.
$cfgCandidates = [
    __DIR__ . '/../private/config.php',          // standard layout (private/ above api/)
    __DIR__ . '/../_private/config.php',         // Websupport sometimes uses _private/
    __DIR__ . '/config.php',                     // last-resort fallback (dev only)
];
$configLoaded = false;
foreach ($cfgCandidates as $path) {
    if (is_readable($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}
if (!$configLoaded) {
    http_response_code(500);
    echo json_encode(['error' => 'Server nie je nakonfigurovaný (private/config.php chýba)']);
    exit;
}

require_once __DIR__ . '/_lib/db.php';
require_once __DIR__ . '/_lib/response.php';
require_once __DIR__ . '/_lib/slug.php';
require_once __DIR__ . '/_lib/hash.php';
require_once __DIR__ . '/_lib/auth.php';
require_once __DIR__ . '/_lib/sessions.php';
require_once __DIR__ . '/_lib/users.php';
require_once __DIR__ . '/_lib/trails.php';
require_once __DIR__ . '/_lib/files.php';

/**
 * Read + decode a JSON request body. Returns the parsed array (or []).
 * Throws JsonException on malformed input; callers should catch and emit
 * badRequest('Neplatný JSON').
 */
function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    return json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
}
