<?php
/**
 * Announcements table access — the news items the home-page ants tow.
 *
 * Unlike trails there is no JSON payload column: the shape is small and
 * fixed, so plain columns keep the queries readable and the admin editor
 * honest about what exists. Rows travel to the SPA as camelCase.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

const ANNOUNCEMENT_KINDS = ['text', 'image'];

/** Cap on the blog article body, in characters. */
const ANNOUNCEMENT_BODY_MAX = 50000;

/** Media for announcements lives under this reserved tracks/ folder. */
const ANNOUNCEMENTS_STORAGE_ID = 'announcements';

function announcement_to_payload(array $row): array {
    return [
        'id'        => (int) $row['id'],
        'kind'      => $row['kind'],
        'text'      => $row['text'],
        'body'      => (string) ($row['body'] ?? ''),
        'mediaUrl'  => $row['media_url'],
        'linkUrl'   => $row['link_url'],
        'active'    => (bool) $row['active'],
        'inTicker'  => (bool) ($row['in_ticker'] ?? 1),
        'sortOrder' => (int) $row['sort_order'],
        'createdBy' => $row['created_by'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

/**
 * @param bool $activeOnly  published blog posts only (public views)
 * @param bool $tickerOnly  additionally only posts the admin picked for the ants
 * @return array[] ticker order: sort_order, then id (stable for ties)
 */
function list_announcements(bool $activeOnly, bool $tickerOnly = false): array {
    $where = [];
    if ($activeOnly) $where[] = 'active = 1';
    if ($tickerOnly) $where[] = 'in_ticker = 1';
    $sql = 'SELECT * FROM announcements'
         . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
         . ' ORDER BY sort_order, id';
    $out = [];
    foreach (db()->query($sql)->fetchAll() as $row) {
        $out[] = announcement_to_payload($row);
    }
    return $out;
}

function get_announcement(int $id): ?array {
    $stmt = db()->prepare('SELECT * FROM announcements WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();
    return $row ? announcement_to_payload($row) : null;
}

/**
 * Insert a new announcement at the end of the ticker (max sort_order + 1).
 * $data keys: kind, text, body, mediaUrl, linkUrl, active, inTicker,
 * createdBy — already validated by the handler.
 */
function create_announcement(array $data): array {
    $pdo = db();
    $next = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM announcements')
                      ->fetchColumn();
    $stmt = $pdo->prepare(
        'INSERT INTO announcements (kind, text, body, media_url, link_url, active, in_ticker, sort_order, created_by)
         VALUES (:kind, :text, :body, :media, :link, :active, :ticker, :sort, :by)'
    );
    $stmt->execute([
        ':kind'   => $data['kind'],
        ':text'   => $data['text'],
        ':body'   => $data['body'],
        ':media'  => $data['mediaUrl'],
        ':link'   => $data['linkUrl'],
        ':active' => $data['active'] ? 1 : 0,
        ':ticker' => $data['inTicker'] ? 1 : 0,
        ':sort'   => $next,
        ':by'     => $data['createdBy'],
    ]);
    return get_announcement((int) $pdo->lastInsertId());
}

/**
 * Partial update. $fields may hold: text, body, linkUrl, active, inTicker,
 * sortOrder. kind and mediaUrl are immutable — replacing the picture means a
 * new announcement, which keeps file cleanup a delete-time-only concern.
 */
function update_announcement(int $id, array $fields): void {
    $sets = [];
    $params = [':id' => $id];
    if (array_key_exists('text', $fields)) {
        $sets[] = 'text = :text';
        $params[':text'] = $fields['text'];
    }
    if (array_key_exists('body', $fields)) {
        $sets[] = 'body = :body';
        $params[':body'] = $fields['body'];
    }
    if (array_key_exists('inTicker', $fields)) {
        $sets[] = 'in_ticker = :ticker';
        $params[':ticker'] = $fields['inTicker'] ? 1 : 0;
    }
    if (array_key_exists('linkUrl', $fields)) {
        $sets[] = 'link_url = :link';
        $params[':link'] = $fields['linkUrl'];
    }
    if (array_key_exists('active', $fields)) {
        $sets[] = 'active = :active';
        $params[':active'] = $fields['active'] ? 1 : 0;
    }
    if (array_key_exists('sortOrder', $fields)) {
        $sets[] = 'sort_order = :sort';
        $params[':sort'] = (int) $fields['sortOrder'];
    }
    if (!$sets) return;
    db()->prepare('UPDATE announcements SET ' . implode(', ', $sets) . ' WHERE id = :id')
        ->execute($params);
}

function delete_announcement(int $id): void {
    db()->prepare('DELETE FROM announcements WHERE id = :id')->execute([':id' => $id]);
}

/**
 * Whether any other announcement still points at the same file. Guards the
 * unlink on delete — duplicating an announcement must not orphan its twin.
 */
function announcement_media_in_use(string $mediaUrl, int $excludeId): bool {
    if ($mediaUrl === '') return false;
    $stmt = db()->prepare(
        'SELECT COUNT(*) FROM announcements WHERE media_url = :url AND id <> :id'
    );
    $stmt->execute([':url' => $mediaUrl, ':id' => $excludeId]);
    return (int) $stmt->fetchColumn() > 0;
}
