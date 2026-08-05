<?php
/**
 * PDO singleton for MariaDB on Websupport.
 *
 * Expects these constants (defined in private/config.php):
 *   DB_NAME, DB_USER, DB_PASSWORD
 *   DB_SOCKET  — unix socket path; preferred when present
 *   DB_HOST    — used when DB_SOCKET is unset
 *   DB_PORT    — optional, default 3306
 *
 * Websupport's MariaDB is not on localhost: it answers on db.r2.websupport.sk
 * over TCP, and on a unix socket from the web servers themselves. The socket
 * is preferred — it keeps the credentials and every query off the network,
 * which matters because this connection has no TLS.
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
    if (!defined('DB_NAME') || !defined('DB_USER') || !defined('DB_PASSWORD')) {
        throw new RuntimeException('DB not configured: define DB_NAME/DB_USER/DB_PASSWORD in private/config.php');
    }
    // Candidates in preference order: the socket keeps traffic off the network,
    // TCP works everywhere. Each is *attempted* rather than probed first --
    // open_basedir forbids stat()ing the socket path on the web servers, and
    // because bootstrap.php promotes warnings to exceptions, a file_exists()
    // check there turns into a 500 on every database-backed request.
    $dsns = [];
    if (defined('DB_SOCKET') && DB_SOCKET !== '') {
        $dsns[] = sprintf('mysql:unix_socket=%s;dbname=%s;charset=utf8mb4', DB_SOCKET, DB_NAME);
    }
    if (defined('DB_HOST') && DB_HOST !== '') {
        $port = defined('DB_PORT') ? (int) DB_PORT : 3306;
        $dsns[] = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', DB_HOST, $port, DB_NAME);
    }
    if (!$dsns) {
        throw new RuntimeException('DB not configured: define DB_SOCKET or DB_HOST in private/config.php');
    }

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_PERSISTENT         => true,
    ];

    $pdo = null;
    $lastError = null;
    foreach ($dsns as $dsn) {
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, $options);
            break;
        } catch (PDOException $e) {
            $lastError = $e;
        }
    }
    if ($pdo === null) {
        throw $lastError;
    }
    // Strict SQL mode so invalid dates / out-of-range values fail loudly.
    $pdo->exec("SET sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'");

    $GLOBALS['_pdo'] = $pdo;
    return $pdo;
}
