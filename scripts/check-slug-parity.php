<?php
/**
 * Check the server-side slug against scripts/slug-fixtures.json.
 *
 *   php scripts/check-slug-parity.php
 *
 * Run this on the Websupport shell before trusting a deploy. It exercises
 * whichever code path that host actually takes: intl's Normalizer when the
 * extension is loaded, and the transliteration table in _lib/slug.php when it
 * is not. Both must produce the same answers as the browser, because the
 * browser names the upload folder and the server names the database row.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/_lib/slug.php';

$fixtures = json_decode((string) file_get_contents(__DIR__ . '/slug-fixtures.json'), true);
if (!is_array($fixtures) || !isset($fixtures['cases'])) {
    fwrite(STDERR, "Could not read slug-fixtures.json\n");
    exit(2);
}

printf("intl extension: %s\n\n", extension_loaded('intl') ? 'LOADED (Normalizer path)' : 'MISSING (transliteration fallback path)');

$failed = 0;
foreach ($fixtures['cases'] as [$input, $expected]) {
    $actual = slugify((string) $input);
    $ok = $actual === $expected;
    if (!$ok) $failed++;
    printf(
        "%s  %-24s -> %s%s\n",
        $ok ? 'ok  ' : 'FAIL',
        json_encode($input, JSON_UNESCAPED_UNICODE),
        json_encode($actual, JSON_UNESCAPED_UNICODE),
        $ok ? '' : '   expected ' . json_encode($expected, JSON_UNESCAPED_UNICODE)
    );
}

$total = count($fixtures['cases']);
printf("\n%d/%d passed\n", $total - $failed, $total);
exit($failed ? 1 : 0);
