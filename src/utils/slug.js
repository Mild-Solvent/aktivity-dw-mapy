// The canonical trail slug — browser side.
//
// A trail's slug is simultaneously its database primary key, its URL segment,
// and its folder name under tracks/. The browser computes it to name the
// upload folder; the server computes it to name the row. If the two ever
// disagree, deleting a trail leaves its files behind forever, because the
// delete path recomputes the folder from the id.
//
// The PHP counterpart is slugify() in api/_lib/slug.php. Both are checked
// against scripts/slug-fixtures.json — see scripts/check-slug-parity.{mjs,php}.
//
// Kept dependency-free so it can run under plain Node in the parity check.

const COMBINING_MARKS = /[\u0300-\u036f]/g

export const getStorageTrailId = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
