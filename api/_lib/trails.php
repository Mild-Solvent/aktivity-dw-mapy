<?php
/**
 * Trails table access (replaces Redis trails:<id> + trails:index).
 *
 * The trail id IS the primary key AND the storage folder name under
 * tracks/. The slugify() rules below MUST stay in sync with:
 *   - getStorageTrailId() in src/data/customTrails.js
 *   - storageTrailId() in api/_lib/blob.js (Node, legacy)
 *
 * The payload column holds the full JSON trail object; TRAIL_FIELDS below
 * is the allowlist enforced by handlers before saveTrail() is called.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

/**
 * The 24 fields a trail payload may carry — verbatim from
 * api/trails/[id].js:7-12. Anything else in the incoming body is dropped.
 */
const TRAIL_FIELDS = [
    'id', 'name', 'description', 'sport', 'activityType', 'bikeType',
    'difficulty', 'distance', 'distanceValue', 'duration', 'elevation',
    'location', 'locationRegion', 'previewImage', 'gpxFile', 'gpxFileName',
    'galleryImages', 'mapUrl', 'tags', 'status', 'createdBy',
    'createdAt', 'updatedAt',
];

/**
 * Sanitize a payload to the known field set. Mirrors sanitize() in
 * api/trails/[id].js.
 */
function sanitize_trail_payload(array $payload): array {
    $out = [];
    foreach (TRAIL_FIELDS as $field) {
        if (array_key_exists($field, $payload)) {
            $out[$field] = $payload[$field];
        }
    }
    return $out;
}

/**
 * Canonical slug. MUST match slugify() in api/trails/[id].js:23-34 and
 * storageTrailId() in api/_lib/blob.js.
 */
function slugify(string $s): string {
    $s = trim(strtolower((string) $s));
    // Decompose accents (Slovak diacritics) and drop combining marks.
    $s = normalizer_normalize($s, Normalizer::FORM_D);
    $s = preg_replace('/\p{M}/u', '', $s);
    // Collapse non-alphanumerics to '-'.
    $s = preg_replace('/[^a-z0-9-]+/', '-', $s);
    $s = trim($s, '-');
    return $s ?? '';
}

/** Return every trail payload (published + draft). */
function list_trails(): array {
    $stmt = db()->query('SELECT id, payload FROM trails ORDER BY id');
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $payload = json_decode($row['payload'], true);
        if (is_array($payload)) {
            $payload['id'] = $row['id'];
            $out[] = $payload;
        }
    }
    return $out;
}

/** Fetch one trail by id, with id stamped in. */
function get_trail(string $id): ?array {
    $stmt = db()->prepare('SELECT id, payload FROM trails WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $payload = json_decode($row['payload'], true);
    if (!is_array($payload)) return null;
    $payload['id'] = $row['id'];
    return $payload;
}

/**
 * Upsert a trail payload. The id is authoritative (already slugified by
 * the handler). Mirrors saveTrail() in Node.
 */
function save_trail(string $id, array $payload): array {
    $payload['id'] = $id;
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    db()->prepare(
        'INSERT INTO trails (id, payload, created_at, updated_at)
         VALUES (:id, :payload, NOW(), NOW())
         ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = NOW()'
    )->execute([
        ':id'      => $id,
        ':payload' => $json,
    ]);
    return $payload;
}

function delete_trail(string $id): void {
    db()->prepare('DELETE FROM trails WHERE id = :id')
        ->execute([':id' => $id]);
}
