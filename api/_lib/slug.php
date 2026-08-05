<?php
/**
 * The canonical trail slug — single source of truth for the PHP side.
 *
 * A trail's slug is used as three different things at once: the `trails`
 * primary key, the URL segment, and the folder name under tracks/. If any
 * two of those disagree the app silently loses files, so every caller goes
 * through slugify() here rather than rolling its own.
 *
 * The JS counterpart is getStorageTrailId() in src/data/customTrails.js and
 * must produce identical output. Both do: strip accents, lowercase, collapse
 * anything that is not [a-z0-9-] into '-', trim leading/trailing '-'.
 *
 * Accents are stripped before lowercasing, not after. That order means the
 * ASCII-only strtolower() is enough and mbstring is never needed: "KOLAČÍN"
 * decomposes to "KOLACIN" and only then becomes "kolacin". Lowercasing first
 * would leave the multibyte "Č" untouched and the regex would turn it into a
 * stray '-'.
 */

declare(strict_types=1);

/**
 * Fallback transliteration for hosts without the intl extension. Covers
 * Slovak and Czech in both cases, plus the neighbouring Latin-2 letters that
 * turn up in place names. Uppercase entries matter because accents are
 * stripped before the lowercase pass.
 */
const SLUG_ASCII_MAP = [
    'á'=>'a','ä'=>'a','à'=>'a','â'=>'a','ã'=>'a','å'=>'a','ā'=>'a','ą'=>'a',
    'Á'=>'A','Ä'=>'A','À'=>'A','Â'=>'A','Ã'=>'A','Å'=>'A','Ā'=>'A','Ą'=>'A',
    'č'=>'c','ć'=>'c','ç'=>'c','ĉ'=>'c','Č'=>'C','Ć'=>'C','Ç'=>'C','Ĉ'=>'C',
    'ď'=>'d','đ'=>'d','Ď'=>'D','Đ'=>'D',
    'é'=>'e','ě'=>'e','è'=>'e','ê'=>'e','ë'=>'e','ē'=>'e','ę'=>'e',
    'É'=>'E','Ě'=>'E','È'=>'E','Ê'=>'E','Ë'=>'E','Ē'=>'E','Ę'=>'E',
    'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i','ī'=>'i','Í'=>'I','Ì'=>'I','Î'=>'I','Ï'=>'I','Ī'=>'I',
    'ĺ'=>'l','ľ'=>'l','ł'=>'l','Ĺ'=>'L','Ľ'=>'L','Ł'=>'L',
    'ň'=>'n','ń'=>'n','ñ'=>'n','Ň'=>'N','Ń'=>'N','Ñ'=>'N',
    'ó'=>'o','ô'=>'o','ò'=>'o','ö'=>'o','õ'=>'o','ō'=>'o','ø'=>'o',
    'Ó'=>'O','Ô'=>'O','Ò'=>'O','Ö'=>'O','Õ'=>'O','Ō'=>'O','Ø'=>'O',
    'ŕ'=>'r','ř'=>'r','Ŕ'=>'R','Ř'=>'R',
    'š'=>'s','ś'=>'s','ş'=>'s','ș'=>'s','Š'=>'S','Ś'=>'S','Ş'=>'S','Ș'=>'S',
    'ť'=>'t','ţ'=>'t','ț'=>'t','Ť'=>'T','Ţ'=>'T','Ț'=>'T',
    'ú'=>'u','ů'=>'u','ù'=>'u','û'=>'u','ü'=>'u','ū'=>'u',
    'Ú'=>'U','Ů'=>'U','Ù'=>'U','Û'=>'U','Ü'=>'U','Ū'=>'U',
    'ý'=>'y','ÿ'=>'y','Ý'=>'Y','Ÿ'=>'Y',
    'ž'=>'z','ź'=>'z','ż'=>'z','Ž'=>'Z','Ź'=>'Z','Ż'=>'Z',
    'ß'=>'ss','æ'=>'ae','Æ'=>'AE','œ'=>'oe','Œ'=>'OE',
];

/**
 * Reduce accented Latin letters to ASCII. Uses intl when available and the
 * transliteration table otherwise — Websupport's PHP build is not guaranteed
 * to ship the intl extension, and an unguarded Normalizer call would fatal
 * every trail read, write and upload.
 */
function slug_strip_accents(string $s): string {
    if (class_exists('Normalizer')) {
        $decomposed = Normalizer::normalize($s, Normalizer::FORM_D);
        if (is_string($decomposed)) {
            return (string) preg_replace('/\p{M}/u', '', $decomposed);
        }
    }
    return strtr($s, SLUG_ASCII_MAP);
}

/**
 * Canonical slug. Must stay identical to getStorageTrailId() in
 * src/data/customTrails.js.
 *
 *   "Kolačín"       → "kolacin"
 *   "Nová Dubnica"  → "nova-dubnica"
 *   "KOLAČÍN"       → "kolacin"
 */
function slugify(string $s): string {
    $s = slug_strip_accents(trim($s));
    $s = strtolower($s);
    $s = (string) preg_replace('/[^a-z0-9-]+/', '-', $s);
    return trim($s, '-');
}
