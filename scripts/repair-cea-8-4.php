<?php
/**
 * One-off repair for the trail "CEA 8,4", on the server.
 *
 *   php scripts/repair-cea-8-4.php            # dry run — prints the plan, changes nothing
 *   php scripts/repair-cea-8-4.php --apply
 *
 * Why this exists
 * ---------------
 * The Add/Edit form used to let the editor type the trail id by hand, and the
 * uploads folder followed that field while the database row kept its original
 * id. In July 2026 "CEA 8,4" was saved that way: its row is still keyed
 * `est-ut-perferendis`, but every one of its files lives in `tracks/beh/` —
 * the folder belonging to a *different* trail, "CEA BEH 5 km".
 *
 * Two consequences:
 *   1. Deleting the `beh` trail would take CEA 8,4's preview and gallery with
 *      it, because delete_by_prefix() wipes the whole folder.
 *   2. GPX uploads always use the fixed name `track.gpx`, so both rows point at
 *      the same file. The 11 Aug 2026 save overwrote it — CEA 8,4 has been
 *      serving the 5.2 km `beh` track ever since. The original is not
 *      recoverable, so gpxFile is cleared here rather than left silently wrong.
 *
 * This script gives the trail its own folder and a meaningful id
 * (est-ut-perferendis → cea-8-4, a leftover from seeded demo data).
 *
 * It copies files rather than moving them and dumps the old row to JSON in the
 * home directory first, so the only thing that cannot be undone by hand is
 * nothing. Cleanup of the now-duplicated files in tracks/beh/ is deliberately
 * left as a separate manual step, printed at the end, to be run once the trail
 * has been eyeballed on the live site.
 *
 * Delete this file from the server once the repair is done.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const OLD_ID = 'est-ut-perferendis';
const NEW_ID = 'cea-8-4';

$apply = in_array('--apply', array_slice($argv, 1), true);

// Same config lookup as scripts/db-exec.php, so this runs from the repo root
// or from the deployed docroot.
$root = dirname(__DIR__);
$loaded = false;
foreach ([$root . '/private/config.php', $root . '/_private/config.php'] as $candidate) {
    if (is_readable($candidate)) {
        require_once $candidate;
        $loaded = true;
        break;
    }
}
if (!$loaded) {
    fwrite(STDERR, "private/config.php not found under $root\n");
    exit(2);
}

require_once $root . '/api/_lib/db.php';
require_once $root . '/api/_lib/files.php';

$pdo = db();
$docroot = docroot();
$tracks = $docroot . '/tracks';

echo $apply ? "MODE: apply\n\n" : "MODE: dry run (pass --apply to make the changes)\n\n";

// ── Read the row and refuse to run on anything unexpected ───────────────
$stmt = $pdo->prepare('SELECT * FROM trails WHERE id = :id');
$stmt->execute([':id' => OLD_ID]);
$row = $stmt->fetch();
if (!$row) {
    fwrite(STDERR, "Row '" . OLD_ID . "' not found — already repaired?\n");
    exit(1);
}

$stmt->execute([':id' => NEW_ID]);
if ($stmt->fetch()) {
    fwrite(STDERR, "Row '" . NEW_ID . "' already exists — refusing to overwrite it.\n");
    exit(1);
}

$payload = json_decode((string) $row['payload'], true);
if (!is_array($payload)) {
    fwrite(STDERR, "Payload of '" . OLD_ID . "' is not valid JSON.\n");
    exit(1);
}
printf("Trail: %s (%s)\n", $payload['name'] ?? '?', OLD_ID);

// ── Work out which files move ───────────────────────────────────────────
// Everything the payload references, minus the GPX: that file belongs to the
// other trail and is the wrong track anyway.
$refs = array_values(array_filter(array_merge(
    [$payload['previewImage'] ?? ''],
    $payload['galleryImages'] ?? []
), static fn ($url) => is_string($url) && str_starts_with($url, '/tracks/')));

$moves = [];
foreach ($refs as $url) {
    $rel = substr(rawurldecode($url), strlen('/tracks/'));   // "<folder>/<file>"
    $name = basename($rel);
    $src = $tracks . '/' . $rel;
    if (!is_file($src)) {
        fwrite(STDERR, "  ! missing source file: $src\n");
        exit(1);
    }
    $moves[] = ['src' => $src, 'name' => $name, 'url' => $url];
}

printf("\n%d file(s) to copy into tracks/%s/:\n", count($moves), NEW_ID);
foreach ($moves as $m) {
    printf("  %s\n    -> /tracks/%s/%s\n", $m['url'], NEW_ID, $m['name']);
}
printf("\nGPX cleared (was %s, overwritten by the '%s' trail on 11 Aug 2026):\n  %s\n",
    $payload['gpxFileName'] ?? '?', 'beh', $payload['gpxFile'] ?? '');

$likes = $pdo->prepare('SELECT COUNT(*) FROM trail_likes WHERE trail_id = :id');
$likes->execute([':id' => OLD_ID]);
printf("\nLikes to re-key: %d\n", (int) $likes->fetchColumn());

if (!$apply) {
    echo "\nDry run complete — nothing was changed.\n";
    exit(0);
}

// ── Back up the row before touching anything ────────────────────────────
$backupDir = getenv('HOME') ?: dirname($docroot);
$backupFile = sprintf('%s/aktivity-repair-%s-%s.json', rtrim($backupDir, '/'), OLD_ID, date('Ymd-His'));
if (file_put_contents($backupFile, json_encode($row, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) === false) {
    fwrite(STDERR, "Could not write backup to $backupFile — aborting.\n");
    exit(1);
}
printf("\n✓ row backed up to %s\n", $backupFile);

// ── Copy the files ──────────────────────────────────────────────────────
$destDir = $tracks . '/' . NEW_ID;
if (!is_dir($destDir) && !mkdir($destDir, 0775, true)) {
    fwrite(STDERR, "Could not create $destDir\n");
    exit(1);
}
foreach ($moves as $m) {
    $dest = $destDir . '/' . $m['name'];
    if (!copy($m['src'], $dest)) {
        fwrite(STDERR, "Could not copy {$m['src']} -> $dest\n");
        exit(1);
    }
    @chmod($dest, 0664);
    printf("✓ copied %s\n", $m['name']);
}

// ── Rewrite the payload ─────────────────────────────────────────────────
$rewrite = static fn (string $url): string => '/tracks/' . NEW_ID . '/' . basename(rawurldecode($url));

$payload['id'] = NEW_ID;
if (!empty($payload['previewImage'])) {
    $payload['previewImage'] = $rewrite($payload['previewImage']);
}
if (!empty($payload['galleryImages'])) {
    $payload['galleryImages'] = array_map($rewrite, $payload['galleryImages']);
}
$payload['gpxFile'] = '';
$payload['gpxFileName'] = '';

// ── Re-key the row ──────────────────────────────────────────────────────
// Insert, move the likes, then delete: in that order a like is never orphaned,
// and trail_likes has no foreign key to lean on.
$pdo->beginTransaction();
try {
    $insert = $pdo->prepare(
        'INSERT INTO trails (id, payload, created_by, created_at, updated_at)
         VALUES (:id, :payload, :created_by, :created_at, :updated_at)'
    );
    $insert->execute([
        ':id'         => NEW_ID,
        ':payload'    => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':created_by' => $row['created_by'],
        ':created_at' => $row['created_at'],
        ':updated_at' => $row['updated_at'],
    ]);

    $pdo->prepare('UPDATE trail_likes SET trail_id = :new WHERE trail_id = :old')
        ->execute([':new' => NEW_ID, ':old' => OLD_ID]);

    $pdo->prepare('DELETE FROM trails WHERE id = :id')->execute([':id' => OLD_ID]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, "\n✗ database step failed, rolled back: " . $e->getMessage() . "\n");
    fwrite(STDERR, "  The copied files under tracks/" . NEW_ID . "/ are harmless; remove them and retry.\n");
    exit(1);
}

printf("\n✓ %s → %s (row, likes, payload URLs)\n", OLD_ID, NEW_ID);
echo "\nNext:\n";
echo "  1. Check https://aktivity.ceaeurope.sk/track/" . NEW_ID . " — photos and like count.\n";
echo "  2. Ask the client to re-upload the GPX for this trail (the original is gone).\n";
echo "  3. Only then remove the now-duplicated originals:\n";
foreach ($moves as $m) {
    echo "       rm '" . $m['src'] . "'\n";
}
