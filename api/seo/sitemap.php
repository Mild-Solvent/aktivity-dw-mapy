<?php
/**
 * GET /sitemap.xml  (routed here by .htaccess)
 *
 * Generated on request rather than written to disk at build time, because the
 * trails and posts it lists are database rows an admin adds from the browser
 * — a build-time file would be stale the moment someone published anything.
 *
 * robots.txt has advertised this URL since 2025 and Search Console has it
 * submitted, but after the move to Websupport no file answered it: the SPA
 * fallback served index.html with a 200, so Google was fetching a web page
 * where a sitemap should be. This is the file that was missing.
 */

declare(strict_types=1);

// Unlike render.php, this one may fail loudly: a 500 tells Search Console the
// sitemap is temporarily unavailable and to come back, which is the truth. An
// empty urlset served with a 200 would instead be read as "these pages are
// gone" and is the more damaging lie.
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../_lib/seo.php';

header('Content-Type: application/xml; charset=utf-8');
// A crawler that re-fetches this hourly costs two queries; a stale copy costs
// a day of not knowing about a new trail. An hour is the compromise.
header('Cache-Control: public, max-age=3600');

/**
 * One <url> entry. `lastmod` is omitted rather than guessed: an invented date
 * teaches the crawler to distrust every date in the file.
 */
function sitemap_url(string $loc, ?string $lastmod = null, string $changefreq = 'weekly', string $priority = '0.6'): string {
    $out = "  <url>\n    <loc>" . htmlspecialchars($loc, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</loc>\n";
    if ($lastmod) {
        $out .= '    <lastmod>' . htmlspecialchars($lastmod, ENT_XML1 | ENT_QUOTES, 'UTF-8') . "</lastmod>\n";
    }
    $out .= "    <changefreq>$changefreq</changefreq>\n";
    $out .= "    <priority>$priority</priority>\n";
    return $out . "  </url>\n";
}

$urls = '';

// The home page changes whenever a trail is added, which is the most frequent
// thing that happens here.
$urls .= sitemap_url(SEO_ORIGIN . '/', null, 'daily', '1.0');
$urls .= sitemap_url(SEO_ORIGIN . '/novinky', null, 'daily', '0.8');

foreach (seo_published_trails() as $trail) {
    $urls .= sitemap_url(
        seo_abs('/track/' . $trail['id']),
        seo_trail_modified($trail),
        'monthly',
        '0.9'
    );
}

try {
    // limit is capped at 100 inside list_announcements(); a blog that outgrows
    // that needs a paged sitemap index, not a bigger number here.
    foreach (list_announcements(['limit' => 100]) as $post) {
        $stamp = $post['updatedAt'] ?: ($post['publishedAt'] ?: $post['createdAt']);
        $urls .= sitemap_url(
            seo_abs('/novinky/' . ($post['path'] ?? $post['id'])),
            $stamp ? gmdate('c', (int) strtotime((string) $stamp)) : null,
            'monthly',
            '0.7'
        );
    }
} catch (Throwable $e) {
    // A sitemap missing the blog still beats a 500 that invalidates the lot.
    error_log('[seo/sitemap] blog listing failed: ' . $e->getMessage());
}

// Low priority, but they are real pages and Search Console prefers to be told
// about a page than to find it uncrawled.
$urls .= sitemap_url(SEO_ORIGIN . '/terms', null, 'yearly', '0.2');
$urls .= sitemap_url(SEO_ORIGIN . '/privacy', null, 'yearly', '0.2');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
echo $urls;
echo '</urlset>' . "\n";
