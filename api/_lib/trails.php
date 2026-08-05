<?php
/**
 * Trails table access (replaces Redis trails:<id> + trails:index).
 *
 * The trail id IS the primary key AND the storage folder name under tracks/,
 * so slugify() lives in _lib/slug.php and is shared with files.php — see the
 * note there about why there is only one implementation.
 *
 * The payload column holds the full JSON trail object; TRAIL_FIELDS below
 * is the allowlist enforced by handlers before saveTrail() is called.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/slug.php';

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
 * likeCount and likedByMe are stamped onto the payload on read, exactly where
 * the id is. They are deliberately NOT in TRAIL_FIELDS: that allowlist guards
 * what a PUT may write, and a like count living inside the JSON payload would
 * be client-writable and would race with the trail_likes table. The table is
 * the only source of truth; these are a projection of it.
 *
 * @param string|null $viewerEmail  logged-in viewer, or null when anonymous
 */
function list_trails(?string $viewerEmail = null): array {
    $viewer = $viewerEmail !== null ? strtolower(trim($viewerEmail)) : null;
    $stmt = db()->prepare(
        'SELECT t.id,
                t.payload,
                COUNT(l.email)                                     AS like_count,
                MAX(CASE WHEN l.email = :viewer THEN 1 ELSE 0 END) AS liked_by_me
           FROM trails t
           LEFT JOIN trail_likes l ON l.trail_id = t.id
          GROUP BY t.id, t.payload
          ORDER BY t.id'
    );
    // A null viewer never equals a stored email, so liked_by_me stays 0.
    $stmt->execute([':viewer' => $viewer]);

    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $payload = json_decode($row['payload'], true);
        if (is_array($payload)) {
            $payload['id']         = $row['id'];
            $payload['likeCount']  = (int) $row['like_count'];
            $payload['likedByMe']  = (bool) $row['liked_by_me'];
            $out[] = $payload;
        }
    }
    return $out;
}

/** Fetch one trail by id, with id and like fields stamped in. */
function get_trail(string $id, ?string $viewerEmail = null): ?array {
    $viewer = $viewerEmail !== null ? strtolower(trim($viewerEmail)) : null;
    $stmt = db()->prepare(
        'SELECT t.id,
                t.payload,
                COUNT(l.email)                                     AS like_count,
                MAX(CASE WHEN l.email = :viewer THEN 1 ELSE 0 END) AS liked_by_me
           FROM trails t
           LEFT JOIN trail_likes l ON l.trail_id = t.id
          WHERE t.id = :id
          GROUP BY t.id, t.payload'
    );
    $stmt->execute([':id' => $id, ':viewer' => $viewer]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $payload = json_decode($row['payload'], true);
    if (!is_array($payload)) return null;
    $payload['id']        = $row['id'];
    $payload['likeCount'] = (int) $row['like_count'];
    $payload['likedByMe'] = (bool) $row['liked_by_me'];
    return $payload;
}

// ── Likes ───────────────────────────────────────────────────────────────

/**
 * Like a trail. INSERT IGNORE because the composite primary key already
 * enforces one-like-per-person — a repeat click is a no-op, not an error.
 */
function like_trail(string $trailId, string $email): void {
    db()->prepare(
        'INSERT IGNORE INTO trail_likes (email, trail_id) VALUES (:email, :trail)'
    )->execute([':email' => strtolower(trim($email)), ':trail' => $trailId]);
}

function unlike_trail(string $trailId, string $email): void {
    db()->prepare(
        'DELETE FROM trail_likes WHERE email = :email AND trail_id = :trail'
    )->execute([':email' => strtolower(trim($email)), ':trail' => $trailId]);
}

function count_trail_likes(string $trailId): int {
    $stmt = db()->prepare('SELECT COUNT(*) FROM trail_likes WHERE trail_id = :trail');
    $stmt->execute([':trail' => $trailId]);
    return (int) $stmt->fetchColumn();
}

/** Every trail the given user has liked, newest like first. */
function list_liked_trails(string $email): array {
    $stmt = db()->prepare(
        'SELECT t.id, t.payload, l.created_at AS liked_at,
                (SELECT COUNT(*) FROM trail_likes c WHERE c.trail_id = t.id) AS like_count
           FROM trail_likes l
           JOIN trails t ON t.id = l.trail_id
          WHERE l.email = :email
          ORDER BY l.created_at DESC'
    );
    $stmt->execute([':email' => strtolower(trim($email))]);
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $payload = json_decode($row['payload'], true);
        if (is_array($payload)) {
            $payload['id']        = $row['id'];
            $payload['likeCount'] = (int) $row['like_count'];
            $payload['likedByMe'] = true;   // by construction
            $out[] = $payload;
        }
    }
    return $out;
}

/** Drop every like for a trail. Called when the trail itself is deleted. */
function delete_trail_likes(string $trailId): void {
    db()->prepare('DELETE FROM trail_likes WHERE trail_id = :trail')
        ->execute([':trail' => $trailId]);
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
