<?php
/**
 * The SPA shell, with a head that describes the page actually being asked for.
 *
 * .htaccess sends every non-API, non-file request here instead of straight to
 * index.html. This script reads that same index.html, strips the placeholder
 * head it ships with, and writes a real one from the database: title,
 * description, canonical, Open Graph, Twitter card and JSON-LD — plus the
 * correct HTTP status, so a mistyped trail id is a 404 rather than a 200 that
 * Google files away as a soft 404.
 *
 * Nothing about the app changes: the same bundle boots into the same #app.
 *
 * FAILURE POLICY
 * This script sits in front of every page on the site, so it must never be
 * the reason one does not load. Every step that can fail — missing config,
 * database down, malformed row — is caught, and the worst case is the shell
 * served with its built-in generic head, exactly as before this file existed.
 */

declare(strict_types=1);

$docroot = dirname(__DIR__, 2);          // api/seo/ -> api/ -> document root
$shellPath = $docroot . '/index.html';

$shell = @file_get_contents($shellPath);
if ($shell === false) {
    // Nothing to serve. Say so plainly rather than emitting a blank 200.
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>500</title><p>index.html chýba na serveri.';
    exit;
}

$meta = null;
try {
    // bootstrap.php exits with a JSON 500 when private/config.php is missing,
    // which for a *page* would mean a blank screen. Check first and simply
    // skip the database when it is not there.
    $hasConfig = false;
    foreach ([$docroot . '/private/config.php', $docroot . '/_private/config.php', $docroot . '/api/config.php'] as $c) {
        if (is_readable($c)) { $hasConfig = true; break; }
    }
    if ($hasConfig) {
        require_once __DIR__ . '/../bootstrap.php';
        require_once __DIR__ . '/../_lib/seo.php';
        $meta = seo_meta_for_path($_SERVER['REQUEST_URI'] ?? '/');
    }
} catch (Throwable $e) {
    error_log('[seo/render] falling back to the static head: ' . $e->getMessage());
    $meta = null;
}

// bootstrap.php sets a JSON content type for API handlers; this is a page.
header('Content-Type: text/html; charset=utf-8');
// Same rule index.html itself gets in .htaccess: always revalidate, because
// the head is per-request and the bundle it names changes on every deploy.
header('Cache-Control: no-cache');

if ($meta === null) {
    // Degraded, but not wrong. index.html hard-codes
    // <link rel="canonical" href="…/">, which on any URL but the home page
    // says "this page is a duplicate of the home page" — the exact bug this
    // whole layer exists to fix. No canonical at all lets Google fall back to
    // the requested URL, which is the right answer.
    echo preg_replace('#[ \t]*<link\s+rel="canonical"[^>]*>\R?#i', '', $shell) ?? $shell;
    exit;
}

http_response_code((int) $meta['status']);
echo seo_render_shell($shell, $meta);

/**
 * Swap the shell's placeholder head for this page's.
 *
 * Removal first, then one insertion. Editing the existing tags in place would
 * mean a regex per tag and would silently do nothing the day someone reorders
 * index.html; dropping the whole managed set and re-emitting it cannot drift.
 */
function seo_render_shell(string $shell, array $meta): string {
    // The tags this script owns. Everything else in <head> — charset,
    // viewport, favicons, manifest, theme-color, the Vite script and CSS
    // links — is left exactly where it is.
    $managed = [
        '#<title>.*?</title>#is',
        '#[ \t]*<meta\s+name="(?:title|description|keywords|robots)"[^>]*>\R?#is',
        '#[ \t]*<meta\s+(?:property|name)="(?:og|twitter):[^"]*"[^>]*>\R?#is',
        '#[ \t]*<link\s+rel="canonical"[^>]*>\R?#is',
        '#[ \t]*<script type="application/ld\+json">.*?</script>\R?#is',
    ];
    $head = preg_replace($managed, '', $shell) ?? $shell;

    $block = seo_head_block($meta);

    // Insert immediately after <head> so the title is in the first bytes the
    // crawler reads, ahead of the render-blocking bundle.
    $out = preg_replace('#(<head[^>]*>)#i', '$1' . "\n" . $block, $head, 1);
    $out = $out ?? $head;

    // A text-only copy of the page for clients that do not run JavaScript:
    // Bing and Seznam render far less reliably than Googlebot, and social
    // scrapers not at all. It mirrors what the SPA renders — same headline,
    // same summary, same links — so it is a fallback, not a second version.
    if ($meta['noscript'] ?? '') {
        $out = str_replace(
            '<div id="app"></div>',
            '<div id="app"></div>' . "\n" . '<noscript>' . $meta['noscript'] . '</noscript>',
            $out
        );
    }

    return $out;
}

/** The <head> tags for one page, already escaped. */
function seo_head_block(array $meta): string {
    $e = static function ($value): string {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    };

    $tags = [];
    $tags[] = '<title>' . $e($meta['title']) . '</title>';
    $tags[] = '<meta name="description" content="' . $e($meta['description']) . '" />';
    $tags[] = '<meta name="robots" content="' . $e($meta['robots']) . '" />';
    // Pages that must not be indexed (404s, the back office) deliberately
    // carry no canonical — see seo_meta_not_found().
    if (!empty($meta['canonical'])) {
        $tags[] = '<link rel="canonical" href="' . $e($meta['canonical']) . '" />';
    }

    $tags[] = '<meta property="og:type" content="' . $e($meta['type']) . '" />';
    $tags[] = '<meta property="og:site_name" content="' . $e(SEO_SITE_NAME) . '" />';
    $tags[] = '<meta property="og:locale" content="sk_SK" />';
    if (!empty($meta['canonical'])) {
        $tags[] = '<meta property="og:url" content="' . $e($meta['canonical']) . '" />';
    }
    $tags[] = '<meta property="og:title" content="' . $e($meta['title']) . '" />';
    $tags[] = '<meta property="og:description" content="' . $e($meta['description']) . '" />';
    $tags[] = '<meta property="og:image" content="' . $e($meta['image']) . '" />';
    $tags[] = '<meta property="og:image:alt" content="' . $e($meta['imageAlt']) . '" />';

    if (!empty($meta['published'])) {
        $tags[] = '<meta property="article:published_time" content="' . $e($meta['published']) . '" />';
    }
    if (!empty($meta['modified'])) {
        $tags[] = '<meta property="article:modified_time" content="' . $e($meta['modified']) . '" />';
    }

    $tags[] = '<meta name="twitter:card" content="summary_large_image" />';
    $tags[] = '<meta name="twitter:title" content="' . $e($meta['title']) . '" />';
    $tags[] = '<meta name="twitter:description" content="' . $e($meta['description']) . '" />';
    $tags[] = '<meta name="twitter:image" content="' . $e($meta['image']) . '" />';

    if ($meta['jsonld']) {
        // One @graph rather than several <script> blocks: it lets the nodes
        // reference each other by @id (every page's publisher points at the
        // single Organization node) instead of repeating it.
        $graph = json_encode(
            ['@context' => 'https://schema.org', '@graph' => array_values($meta['jsonld'])],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
        );
        if ($graph !== false) {
            // "</" inside a JSON string would close the script element early.
            $graph = str_replace('</', '<\/', $graph);
            $tags[] = '<script type="application/ld+json">' . $graph . '</script>';
        }
    }

    return '  ' . implode("\n  ", $tags) . "\n";
}
