<?php
/**
 * Run a .sql file against the app's own database, on the server.
 *
 *   php scripts/db-exec.php migrations/001_init.sql
 *   php scripts/db-exec.php migrate.sql
 *
 * Credentials come from private/config.php via the same PDO helper the API
 * uses, so nothing sensitive ever appears in an argument, an environment
 * variable, or shell history — which is what a `mysql -p...` invocation would
 * leak into ~/.bash_history on shared hosting.
 *
 * This exists because the Websupport shell has no mysql client and the
 * alternative is pasting SQL into phpMyAdmin by hand.
 *
 * Delete this file from the server once the migration is done; it is a
 * deliberate write path into the database and has no business living in a
 * docroot.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$file = $argv[1] ?? '';
if ($file === '') {
    fwrite(STDERR, "usage: php scripts/db-exec.php <file.sql>\n");
    exit(2);
}
if (!is_readable($file)) {
    fwrite(STDERR, "cannot read $file\n");
    exit(2);
}

// Locate config the same way api/bootstrap.php does, so this works whether it
// is run from the repo root or from the deployed docroot.
$root = dirname(__DIR__);
$configCandidates = [
    $root . '/private/config.php',
    $root . '/_private/config.php',
];
$loaded = false;
foreach ($configCandidates as $candidate) {
    if (is_readable($candidate)) {
        require_once $candidate;
        $loaded = true;
        break;
    }
}
if (!$loaded) {
    fwrite(STDERR, "private/config.php not found (looked in: " . implode(', ', $configCandidates) . ")\n");
    exit(2);
}

require_once $root . '/api/_lib/db.php';

/**
 * Split a dump into statements. Naive splitting on ';' would break on
 * semicolons inside the JSON payload strings this migration is full of, so
 * track quoting and backslash escapes.
 */
function split_statements(string $sql): array {
    $statements = [];
    $current = '';
    $quote = null;          // active quote character, or null outside strings
    $escaped = false;
    $len = strlen($sql);

    for ($i = 0; $i < $len; $i++) {
        $ch = $sql[$i];

        if ($quote !== null) {
            $current .= $ch;
            if ($escaped)            { $escaped = false; continue; }
            if ($ch === '\\')        { $escaped = true;  continue; }
            if ($ch === $quote)      { $quote = null; }
            continue;
        }

        // Line comment outside a string: skip to end of line. Keep a newline
        // in its place so the tokens either side cannot be glued together.
        if ($ch === '-' && substr($sql, $i, 2) === '--') {
            $nl = strpos($sql, "\n", $i);
            $i = $nl === false ? $len : $nl;
            $current .= "\n";
            continue;
        }

        if ($ch === "'" || $ch === '"') { $quote = $ch; $current .= $ch; continue; }

        if ($ch === ';') {
            if (trim($current) !== '') $statements[] = trim($current);
            $current = '';
            continue;
        }

        $current .= $ch;
    }

    if (trim($current) !== '') $statements[] = trim($current);
    return $statements;
}

$statements = split_statements((string) file_get_contents($file));
if (!$statements) {
    fwrite(STDERR, "no statements found in $file\n");
    exit(2);
}

$pdo = db();
printf("%s: %d statement(s)\n", $file, count($statements));

$executed = 0;
foreach ($statements as $n => $statement) {
    // The generated dump wraps itself in a transaction; PDO manages its own,
    // so let these through as plain statements rather than fighting over it.
    try {
        $pdo->exec($statement);
        $executed++;
    } catch (PDOException $e) {
        $preview = preg_replace('/\s+/', ' ', substr($statement, 0, 120));
        fwrite(STDERR, sprintf("\n✗ statement %d failed: %s\n  %s…\n", $n + 1, $e->getMessage(), $preview));
        exit(1);
    }
}

printf("✓ %d statement(s) executed\n", $executed);

// Report the resulting state so the caller does not need a second round trip.
foreach (['trails', 'users', 'sessions'] as $table) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        printf("  %-9s %s row(s)\n", $table, $count);
    } catch (PDOException $e) {
        printf("  %-9s (missing)\n", $table);
    }
}
