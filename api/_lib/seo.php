<?php
/**
 * Everything the crawler-facing layer needs to describe one URL.
 *
 * WHY THIS EXISTS
 * The site is a client-rendered Vue SPA: index.html carries one hard-coded
 * title, description and — fatally — one hard-coded
 * <link rel="canonical" href="https://aktivity.ceaeurope.sk/">. Every trail
 * page therefore told Google "the real page is the home page", and Search
 * Console duly reported 8 URLs as "Alternative page with proper canonical
 * tag" against 3 indexed. No amount of client-side JavaScript fixes that
 * reliably, so the head is built here, in PHP, before the HTML leaves the
 * server (see api/seo/render.php).
 *
 * This file only *computes* metadata. It writes no headers and echoes
 * nothing, so the sitemap can reuse the same URL vocabulary.
 */

declare(strict_types=1);

require_once __DIR__ . '/trails.php';
require_once __DIR__ . '/announcements.php';

/** Canonical origin. No trailing slash — every helper adds its own. */
const SEO_ORIGIN = 'https://aktivity.ceaeurope.sk';

const SEO_SITE_NAME = 'AKTIVITY DW KLUB';

/** Shown when a page has no picture of its own. */
const SEO_FALLBACK_IMAGE = '/assets/icons/aktivity-dw-logo.png';

/** Google truncates around here; longer text is not penalised, just unseen. */
const SEO_TITLE_MAX = 65;
const SEO_DESCRIPTION_MAX = 160;

/** Relative path to absolute URL. Absolute input is passed through. */
function seo_abs(string $path): string {
    if ($path === '') return SEO_ORIGIN . '/';
    if (preg_match('#^https?://#i', $path)) return $path;
    return SEO_ORIGIN . '/' . ltrim($path, '/');
}

/** Collapse whitespace, strip tags, cut on a word boundary, add an ellipsis. */
function seo_summarize(string $text, int $max): string {
    $text = trim(preg_replace('/\s+/u', ' ', strip_tags($text)) ?? '');
    if ($text === '' || mb_strlen($text) <= $max) return $text;
    $cut = mb_substr($text, 0, $max - 1);
    $space = mb_strrpos($cut, ' ');
    if ($space !== false && $space > $max * 0.6) {
        $cut = mb_substr($cut, 0, $space);
    }
    return rtrim($cut, " ,.;:-") . '…';
}

/**
 * Brand suffix, but only while it fits. A title that ends up truncated in the
 * SERP loses the words that actually earn the click.
 */
function seo_title(string $title, bool $brand = true): string {
    $title = trim(preg_replace('/\s+/u', ' ', $title) ?? '');
    if ($title === '') return SEO_SITE_NAME;
    if (!$brand || mb_strpos($title, SEO_SITE_NAME) !== false) return $title;
    $suffix = ' | ' . SEO_SITE_NAME;
    if (mb_strlen($title . $suffix) > SEO_TITLE_MAX) return $title;
    return $title . $suffix;
}

// -- Vocabulary shared with the UI ---------------------------------------
// Slovak names for the machine-readable enum values stored on a trail. These
// mirror getSportTitle()/DifficultyBadge in the SPA; they exist here so the
// <title> a crawler reads says "bežecká trasa", not "running".

function seo_sport_label(?string $sport): string {
    $map = [
        'running' => 'bežecká',
        'cycling' => 'cyklistická',
        'hiking'  => 'turistická',
        'walking' => 'turistická',
    ];
    return $map[$sport ?? ''] ?? 'outdoorová';
}

function seo_difficulty_label(?string $difficulty): string {
    $map = [
        'beginner'     => 'pre začiatočníkov',
        'easy'         => 'ľahká',
        'moderate'     => 'stredne náročná',
        'intermediate' => 'stredne náročná',
        'hard'         => 'náročná',
        'expert'       => 'veľmi náročná',
    ];
    return $map[$difficulty ?? ''] ?? '';
}

// -- Plain-HTML mirror ----------------------------------------------------
// Googlebot renders JavaScript; Bing, Seznam and every social scraper do so
// badly or not at all. These blocks go inside <noscript>, so a visitor with
// JavaScript never sees them, and they say exactly what the SPA renders —
// same headline, same summary, same links.

/** HTML-escape for the noscript blocks. */
function seo_esc(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** <li><a> per trail. Also the only crawl path to a trail without JavaScript. */
function seo_noscript_trail_links(array $trails): string {
    if (!$trails) return '';
    $items = '';
    foreach ($trails as $t) {
        $items .= '<li><a href="/track/' . seo_esc((string) ($t['id'] ?? '')) . '">'
                . seo_esc((string) ($t['name'] ?? ''))
                . '</a>' . ($t['distance'] ?? '' ? ' — ' . seo_esc((string) $t['distance']) : '')
                . '</li>';
    }
    return '<ul>' . $items . '</ul>';
}

// -- Route metadata ------------------------------------------------------

/**
 * The default head: what every page gets before its own route refines it.
 *
 * `status` rides along because the two are decided together — a trail id that
 * resolves to nothing needs both a "not found" title and a 404, and returning
 * 200 for it is what turns a typo into an indexed soft-404.
 */
function seo_defaults(): array {
    return [
        'status'      => 200,
        'title'       => 'Trasy na behanie, bicykel a turistiku | ' . SEO_SITE_NAME,
        'description' => 'Objavte overené bežecké, cyklistické a turistické trasy na Slovensku. '
                       . 'Mapy, prevýšenie, náročnosť a GPX súbory na stiahnutie zadarmo.',
        'canonical'   => seo_abs('/'),
        'image'       => seo_abs(SEO_FALLBACK_IMAGE),
        'imageAlt'    => SEO_SITE_NAME,
        'type'        => 'website',
        'robots'      => 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
        'jsonld'      => [],
        'published'   => null,
        'modified'    => null,
        // Plain-HTML mirror of the page for clients that do not run the
        // bundle. Filled in per route; see seo_noscript_* below.
        'noscript'    => '',
    ];
}

/** The Organization node every page points its publisher at. */
function seo_organization(): array {
    return [
        '@type' => 'Organization',
        '@id'   => SEO_ORIGIN . '/#organization',
        'name'  => SEO_SITE_NAME,
        'url'   => SEO_ORIGIN . '/',
        'logo'  => [
            '@type' => 'ImageObject',
            'url'   => seo_abs(SEO_FALLBACK_IMAGE),
        ],
        'areaServed' => ['@type' => 'Country', 'name' => 'Slovensko'],
    ];
}

/** BreadcrumbList from [label => path] pairs, Home first. */
function seo_breadcrumbs(array $crumbs): array {
    $items = [];
    $position = 1;
    foreach ($crumbs as $name => $path) {
        $items[] = [
            '@type'    => 'ListItem',
            'position' => $position++,
            'name'     => $name,
            'item'     => seo_abs($path),
        ];
    }
    return ['@type' => 'BreadcrumbList', 'itemListElement' => $items];
}

/**
 * Head for / — the trail index.
 *
 * The count and the newest photo come from the database so the snippet and
 * the social card grow with the catalogue instead of going stale.
 */
function seo_meta_home(): array {
    $meta = seo_defaults();

    $trails = seo_published_trails();
    $count  = count($trails);
    if ($count > 0) {
        $meta['description'] = 'Objavte ' . $count . ' overených trás na behanie, bicykel a turistiku '
            . 'na Slovensku. Mapy, prevýšenie, náročnosť a GPX súbory na stiahnutie zadarmo.';
        foreach ($trails as $t) {
            if (!empty($t['previewImage'])) {
                $meta['image']    = seo_abs((string) $t['previewImage']);
                $meta['imageAlt'] = (string) ($t['name'] ?? SEO_SITE_NAME);
                break;
            }
        }
    }

    $meta['noscript'] = '<h1>Trasy na behanie, bicykel a turistiku</h1>'
        . '<p>' . seo_esc($meta['description']) . '</p>'
        . seo_noscript_trail_links($trails)
        . '<p><a href="/novinky">Novinky a články</a></p>';

    $meta['jsonld'] = [
        [
            '@type'           => 'WebSite',
            '@id'             => SEO_ORIGIN . '/#website',
            'name'            => SEO_SITE_NAME,
            'url'             => SEO_ORIGIN . '/',
            'inLanguage'      => 'sk-SK',
            'publisher'       => ['@id' => SEO_ORIGIN . '/#organization'],
            'potentialAction' => [
                '@type'       => 'SearchAction',
                'target'      => [
                    '@type'       => 'EntryPoint',
                    'urlTemplate' => SEO_ORIGIN . '/?search={search_term_string}',
                ],
                'query-input' => 'required name=search_term_string',
            ],
        ],
        seo_organization(),
        seo_trail_item_list($trails),
    ];

    return $meta;
}

/** ItemList of every trail — the machine-readable twin of the card grid. */
function seo_trail_item_list(array $trails): array {
    $items = [];
    $position = 1;
    foreach ($trails as $t) {
        $items[] = [
            '@type'    => 'ListItem',
            'position' => $position++,
            'url'      => seo_abs('/track/' . ($t['id'] ?? '')),
            'name'     => (string) ($t['name'] ?? ''),
        ];
    }
    return [
        '@type'           => 'ItemList',
        'name'            => 'Trasy',
        'numberOfItems'   => count($items),
        'itemListElement' => $items,
    ];
}

/** Head for /track/<id>. Returns a 404 head when the id resolves to nothing. */
function seo_meta_trail(string $id): array {
    $trail = $id !== '' ? get_trail(slugify($id)) : null;

    // Drafts are invisible to anonymous visitors in the API, so they must be
    // invisible here too — otherwise the head would leak an unpublished trail
    // into search results the SPA then refuses to render.
    if (!$trail || ($trail['status'] ?? 'published') !== 'published') {
        return seo_meta_not_found();
    }

    $meta     = seo_defaults();
    $name     = (string) ($trail['name'] ?? '');
    $distance = trim((string) ($trail['distance'] ?? ''));
    $sport    = seo_sport_label($trail['sport'] ?? null);
    $location = trim((string) ($trail['location'] ?? ''));

    // "Jesenný Vršatec - 12 km turistická trasa"
    $kind = trim(($distance !== '' ? $distance . ' ' : '') . $sport . ' trasa');
    $meta['title'] = seo_title(implode(' – ', array_filter([$name, $kind])));

    // Lead with the numbers. They are what the searcher is scanning for, and
    // the free-text description on most trails opens with prose.
    $facts = array_filter([
        $distance !== '' ? $distance : null,
        trim((string) ($trail['elevation'] ?? '')) !== '' ? 'prevýšenie ' . $trail['elevation'] : null,
        seo_difficulty_label($trail['difficulty'] ?? null) ?: null,
        $location !== '' ? $location : null,
    ]);
    $lead = $facts ? implode(' · ', $facts) . '. ' : '';
    $meta['description'] = seo_summarize($lead . (string) ($trail['description'] ?? ''), SEO_DESCRIPTION_MAX);

    $meta['canonical'] = seo_abs('/track/' . $trail['id']);
    if (!empty($trail['previewImage'])) {
        $meta['image']    = seo_abs((string) $trail['previewImage']);
        $meta['imageAlt'] = $name;
    }
    $meta['modified'] = seo_trail_modified($trail);

    // TouristTrip is the closest schema.org type for "a route you go and do":
    // it carries the distance, the area and the photo without pretending the
    // trail is a business (LocalBusiness) or an event.
    $trip = array_filter([
        '@type'       => 'TouristTrip',
        '@id'         => $meta['canonical'] . '#trip',
        'name'        => $name,
        'description' => seo_summarize((string) ($trail['description'] ?? ''), 500),
        'url'         => $meta['canonical'],
        'image'       => !empty($trail['previewImage']) ? seo_abs((string) $trail['previewImage']) : null,
        'touristType' => $sport === 'outdoorová' ? null : ucfirst($sport) . ' trasa',
        'provider'    => ['@id' => SEO_ORIGIN . '/#organization'],
        'itinerary'   => $location !== ''
            ? [
                '@type'   => 'Place',
                'name'    => $location,
                'address' => [
                    '@type'          => 'PostalAddress',
                    'addressLocality' => $location,
                    'addressCountry' => 'SK',
                ],
            ]
            : null,
    ], static function ($v) { return $v !== null && $v !== ''; });

    if (isset($trail['distanceValue']) && (float) $trail['distanceValue'] > 0) {
        $trip['subjectOf'] = [
            '@type' => 'Distance',
            'name'  => $distance !== '' ? $distance : ($trail['distanceValue'] . ' km'),
        ];
    }

    $stats = '';
    foreach ([
        'Vzdialenosť' => $distance,
        'Trvanie'     => trim((string) ($trail['duration'] ?? '')),
        'Prevýšenie'  => trim((string) ($trail['elevation'] ?? '')),
        'Náročnosť'   => seo_difficulty_label($trail['difficulty'] ?? null),
        'Lokalita'    => $location,
    ] as $label => $value) {
        if ($value !== '') {
            $stats .= '<li>' . seo_esc($label) . ': ' . seo_esc((string) $value) . '</li>';
        }
    }
    $meta['noscript'] = '<h1>' . seo_esc($name) . '</h1>'
        . ($stats !== '' ? '<ul>' . $stats . '</ul>' : '')
        . '<p>' . nl2br(seo_esc((string) ($trail['description'] ?? ''))) . '</p>'
        . '<p><a href="/">Všetky trasy</a></p>';

    $meta['jsonld'] = [
        $trip,
        seo_breadcrumbs(['Domov' => '/', $name => '/track/' . $trail['id']]),
        seo_organization(),
    ];

    return $meta;
}

/** ms-since-epoch or a date string to ISO 8601, or null when unusable. */
function seo_trail_modified(array $trail): ?string {
    $raw = $trail['updatedAt'] ?? $trail['createdAt'] ?? null;
    if ($raw === null || $raw === '') return null;
    if (is_numeric($raw)) {
        // The SPA stamps Date.now(), i.e. milliseconds.
        $seconds = (int) floor(((float) $raw) / 1000);
        return $seconds > 0 ? gmdate('c', $seconds) : null;
    }
    $ts = strtotime((string) $raw);
    return $ts ? gmdate('c', $ts) : null;
}

/** Head for /novinky. */
function seo_meta_blog_list(): array {
    $meta = seo_defaults();
    $meta['title']       = seo_title('Novinky a články o trasách a behu');
    $meta['description'] = 'Novinky klubu AKTIVITY DW: pozvánky na preteky, reporty z trás a tipy '
                         . 'na behanie, bicykel a turistiku v okolí Trenčína a Novej Dubnice.';
    $meta['canonical']   = seo_abs('/novinky');

    $posts = [];
    try {
        // No includeHidden: the default filter is already "active and past
        // its publish moment", i.e. exactly what the public feed shows.
        $posts = list_announcements(['limit' => 20]);
    } catch (Throwable $e) {
        // A blog that cannot be listed still deserves a correct head.
        error_log('[seo] blog list failed: ' . $e->getMessage());
    }

    $items = [];
    $position = 1;
    $pickedImage = false;
    foreach ($posts as $post) {
        $items[] = [
            '@type'    => 'ListItem',
            'position' => $position++,
            'url'      => seo_abs('/novinky/' . ($post['path'] ?? $post['id'] ?? '')),
            'name'     => (string) ($post['title'] ?? ''),
        ];
        if (!$pickedImage && !empty($post['coverUrl'])) {
            $meta['image'] = seo_abs((string) $post['coverUrl']);
            $pickedImage = true;
        }
    }

    $links = '';
    foreach ($posts as $post) {
        $links .= '<li><a href="/novinky/' . seo_esc((string) ($post['path'] ?? $post['id'] ?? '')) . '">'
                . seo_esc((string) ($post['title'] ?? '')) . '</a></li>';
    }
    $meta['noscript'] = '<h1>Novinky</h1>'
        . ($links !== '' ? '<ul>' . $links . '</ul>' : '')
        . '<p><a href="/">Všetky trasy</a></p>';

    $meta['jsonld'] = [
        [
            '@type'      => 'Blog',
            '@id'        => SEO_ORIGIN . '/novinky#blog',
            'name'       => 'Novinky ' . SEO_SITE_NAME,
            'url'        => seo_abs('/novinky'),
            'inLanguage' => 'sk-SK',
            'publisher'  => ['@id' => SEO_ORIGIN . '/#organization'],
        ],
        ['@type' => 'ItemList', 'numberOfItems' => count($items), 'itemListElement' => $items],
        seo_breadcrumbs(['Domov' => '/', 'Novinky' => '/novinky']),
        seo_organization(),
    ];

    return $meta;
}

/** Head for /novinky/<slug-or-id>. */
function seo_meta_blog_post(string $idOrSlug): array {
    // find_announcement() hands back a payload, not a row, so the derived
    // status is already on it — drafts and not-yet-live scheduled posts must
    // 404 here exactly as they do in the API.
    $post = $idOrSlug !== '' ? find_announcement($idOrSlug) : null;
    if (!$post || ($post['status'] ?? '') !== 'published') {
        return seo_meta_not_found();
    }

    $meta  = seo_defaults();
    $title = trim((string) $post['seoTitle']) !== '' ? (string) $post['seoTitle'] : (string) $post['title'];
    $meta['title'] = seo_title($title);

    $description = trim((string) $post['seoDescription']) !== ''
        ? (string) $post['seoDescription']
        : (string) $post['excerpt'];
    $meta['description'] = seo_summarize($description, SEO_DESCRIPTION_MAX);

    $meta['canonical'] = seo_abs('/novinky/' . $post['path']);
    $meta['type']      = 'article';

    $cover = $post['coverUrl'] !== '' ? (string) $post['coverUrl'] : (string) $post['mediaUrl'];
    if ($cover !== '') {
        $meta['image']    = seo_abs($cover);
        $meta['imageAlt'] = (string) $post['title'];
    }

    $published = $post['publishedAt'] ?: $post['createdAt'];
    $meta['published'] = $published ? gmdate('c', (int) strtotime((string) $published)) : null;
    $meta['modified']  = $post['updatedAt']
        ? gmdate('c', (int) strtotime((string) $post['updatedAt']))
        : $meta['published'];

    $author = trim((string) $post['author']) !== '' ? (string) $post['author'] : SEO_SITE_NAME;

    // The article body is already sanitized HTML (see html_sanitize.php), so
    // it can go in as-is; nothing else on the page is user-authored markup.
    $meta['noscript'] = '<h1>' . seo_esc((string) $post['title']) . '</h1>'
        . ($meta['published'] ? '<p><time datetime="' . seo_esc($meta['published']) . '">'
            . seo_esc(date('j. n. Y', (int) strtotime((string) $published))) . '</time></p>' : '')
        . (string) $post['bodyHtml']
        . '<p><a href="/novinky">Späť na novinky</a></p>';

    $meta['jsonld'] = [
        array_filter([
            '@type'            => 'BlogPosting',
            '@id'              => $meta['canonical'] . '#post',
            'headline'         => seo_summarize((string) $post['title'], 110),
            'description'      => $meta['description'],
            'url'              => $meta['canonical'],
            'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $meta['canonical']],
            'image'            => $cover !== '' ? seo_abs($cover) : null,
            'datePublished'    => $meta['published'],
            'dateModified'     => $meta['modified'],
            'author'           => ['@type' => 'Person', 'name' => $author],
            'publisher'        => ['@id' => SEO_ORIGIN . '/#organization'],
            'inLanguage'       => 'sk-SK',
            'keywords'         => $post['tags'] ? implode(', ', $post['tags']) : null,
            'isPartOf'         => ['@id' => SEO_ORIGIN . '/novinky#blog'],
        ], static function ($v) { return $v !== null && $v !== ''; }),
        seo_breadcrumbs([
            'Domov'                 => '/',
            'Novinky'               => '/novinky',
            (string) $post['title'] => '/novinky/' . $post['path'],
        ]),
        seo_organization(),
    ];

    return $meta;
}

/** A real 404 head. The SPA still renders; only the status line differs. */
function seo_meta_not_found(): array {
    $meta = seo_defaults();
    $meta['status']      = 404;
    $meta['title']       = 'Stránka sa nenašla | ' . SEO_SITE_NAME;
    $meta['description'] = 'Táto stránka neexistuje alebo bola presunutá.';
    $meta['robots']      = 'noindex, follow';
    // No canonical. The default is the home page, and pointing a 404 at it
    // says "this URL is really the home page" — which is the duplicate-content
    // claim this whole layer was written to stop making.
    $meta['canonical']   = null;
    $meta['jsonld']      = [];
    $meta['noscript']    = '<h1>Stránka sa nenašla</h1><p><a href="/">Späť na všetky trasy</a></p>';
    return $meta;
}

/** Head for a page that must never reach the index (admin, account pages). */
function seo_meta_private(string $title): array {
    $meta = seo_defaults();
    $meta['title']     = seo_title($title);
    $meta['robots']    = 'noindex, nofollow';
    $meta['jsonld']    = [];
    // Same reasoning as the 404: better no canonical than one that claims
    // /admin/roles is the home page.
    $meta['canonical'] = null;
    return $meta;
}

/** Head for a simple static page that has no data behind it. */
function seo_meta_static(string $path, string $title, string $description): array {
    $meta = seo_defaults();
    $meta['title']       = seo_title($title);
    $meta['description'] = $description;
    $meta['canonical']   = seo_abs($path);
    $meta['noscript']    = '<h1>' . seo_esc($title) . '</h1><p>' . seo_esc($description) . '</p>'
                         . '<p><a href="/">Všetky trasy</a></p>';
    $meta['jsonld']      = [
        seo_breadcrumbs(['Domov' => '/', $title => $path]),
        seo_organization(),
    ];
    return $meta;
}

// -- Data helpers shared with the sitemap --------------------------------

/** Published trails only, most recently updated first. */
function seo_published_trails(): array {
    try {
        $trails = list_trails(null);
    } catch (Throwable $e) {
        error_log('[seo] trail list failed: ' . $e->getMessage());
        return [];
    }
    $trails = array_values(array_filter(
        $trails,
        static function (array $t): bool { return ($t['status'] ?? 'published') === 'published'; }
    ));
    usort($trails, static function (array $a, array $b): int {
        return (int) ($b['updatedAt'] ?? 0) <=> (int) ($a['updatedAt'] ?? 0);
    });
    return $trails;
}

/**
 * Resolve a request path to its head.
 *
 * The arms below mirror the route table in src/main.js — the SPA and this
 * function have to agree on what exists, or the server would answer 404 for a
 * page the router happily renders. Keep them in step.
 */
function seo_meta_for_path(string $path): array {
    $path = '/' . trim((string) (parse_url($path, PHP_URL_PATH) ?? ''), '/');
    if ($path === '/') return seo_meta_home();

    // Admin, account and one-shot token pages: real pages, but nothing a
    // search engine should hold on to.
    if (str_starts_with($path, '/admin')) return seo_meta_private('Administrácia');
    if ($path === '/moje-oblubene')       return seo_meta_private('Moje obľúbené trasy');
    if ($path === '/reset-password')      return seo_meta_private('Obnova hesla');

    if (preg_match('#^/track/(.+)$#', $path, $m)) {
        return seo_meta_trail(urldecode($m[1]));
    }
    if ($path === '/novinky') return seo_meta_blog_list();
    if (preg_match('#^/novinky/(.+)$#', $path, $m)) {
        return seo_meta_blog_post(urldecode($m[1]));
    }
    if ($path === '/terms') {
        return seo_meta_static(
            '/terms',
            'Všeobecné podmienky',
            'Podmienky používania portálu ' . SEO_SITE_NAME
                . ' — pravidlá pre trasy, GPX súbory a používateľské účty.'
        );
    }
    if ($path === '/privacy') {
        return seo_meta_static(
            '/privacy',
            'Ochrana súkromia',
            'Ako ' . SEO_SITE_NAME . ' spracúva osobné údaje, cookies a údaje o účtoch návštevníkov.'
        );
    }

    return seo_meta_not_found();
}
