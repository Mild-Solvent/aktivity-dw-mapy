<?php
/**
 * PDO singleton for MariaDB on Websupport.
 *
 * Expects these constants (defined in private/config.php):
 *   DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT (optional, default 3306)
 *
 * Connections are persistent + UTF-8mb4 + exception mode. Reads use
 * prepared statements everywhere (no string-interpolated SQL in the codebase).
 */

declare(strict_types=1);

/** @var PDO|null */
$GLOBALS['_pdo'] = null;

function db(): PDO {
    if ($GLOBALS['_pdo'] !== null) {
        return $GLOBALS['_pdo'];
    }
    if (!defined('DB_HOST') || !defined('DB_NAME') || !defined('DB_USER') || !defined('DB_PASSWORD')) {
        throw new RuntimeException('DB not configured: define DB_HOST/DB_NAME/DB_USER/DB_PASSWORD in private/config.php');
    }
    $port = defined('DB_PORT') ? (int) DB_PORT : 3306;
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, $port, DB_NAME);

    $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_PERSISTENT         => true,
    ]);
    // Strict SQL mode so invalid dates / out-of-range values fail loudly.
    $pdo->exec("SET sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'");

    $GLOBALS['_pdo'] = $pdo;
    return $pdo;
}
