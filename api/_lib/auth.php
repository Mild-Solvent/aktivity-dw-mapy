<?php
/**
 * Auth + authorization layer for /api handlers.
 *
 * Direct port of api/_lib/auth.js. Roles mirror src/config/admin.js:
 *   admin / trails_adder → can manage trails ("trail manager")
 *   admin                → can manage users/roles
 *
 * Bootstrap admin (ADMIN_BOOTSTRAP_EMAIL, defined in private/config.php)
 * is always 'admin' regardless of the users table — env is the source of
 * truth, exactly like the Node behavior.
 */

declare(strict_types=1);

require_once __DIR__ . '/sessions.php';
require_once __DIR__ . '/users.php';

const ROLES = [
    'ADMIN'         => 'admin',
    'TRAILS_ADDER'  => 'trails_adder',
    'USER'          => 'user',
];

// Match the Node app's defaults. SESSION_COOKIE_NAME is the cookie the SPA
// reads (credentials: 'include', same-origin).
const SESSION_COOKIE_NAME_DEFAULT = 'dw_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function session_cookie_name(): string {
    return defined('SESSION_COOKIE') ? SESSION_COOKIE : SESSION_COOKIE_NAME_DEFAULT;
}

function bootstrap_email(): string {
    return trim(strtolower(defined('ADMIN_BOOTSTRAP_EMAIL') ? ADMIN_BOOTSTRAP_EMAIL : ''));
}

/**
 * Resolve the effective role for a logged-in email, honoring the bootstrap
 * admin override. Mirrors effectiveRole() in Node.
 *
 * @param string|null $email
 * @param array|null  $dbRecord  Row from users table (password_hash + role)
 */
function effective_role(?string $email, ?array $dbRecord): ?string {
    if (!$email) return null;
    if (strtolower($email) === bootstrap_email()) return ROLES['ADMIN'];
    return $dbRecord['role'] ?? null;
}

function is_trail_manager(?string $role): bool {
    return $role === ROLES['ADMIN'] || $role === ROLES['TRAILS_ADDER'];
}

function is_admin(?string $role): bool {
    return $role === ROLES['ADMIN'];
}

// ── Cookie helpers ───────────────────────────────────────────────────────

function is_https(): bool {
    // Same heuristic as the Node app: dev = HTTP, prod = HTTPS.
    if (($_SERVER['HTTPS'] ?? 'off') !== 'off') return true;
    if (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') return true;
    return false;
}

function set_session_cookie(string $token): void {
    $flags = [
        session_cookie_name() . '=' . rawurlencode($token),
        'Path=/',
        'Max-Age=' . SESSION_TTL_SECONDS,
        'HttpOnly',
        'SameSite=Lax',
    ];
    if (is_https()) $flags[] = 'Secure';
    header('Set-Cookie: ' . implode('; ', $flags));
}

function clear_session_cookie(): void {
    $flags = [
        session_cookie_name() . '=',
        'Path=/',
        'Max-Age=0',
        'HttpOnly',
        'SameSite=Lax',
    ];
    if (is_https()) $flags[] = 'Secure';
    header('Set-Cookie: ' . implode('; ', $flags));
}

function parse_cookies(): array {
    $header = $_SERVER['HTTP_COOKIE'] ?? '';
    $out = [];
    foreach (explode(';', $header) as $part) {
        $idx = strpos($part, '=');
        if ($idx === false) continue;
        $k = trim(substr($part, 0, $idx));
        $v = trim(substr($part, $idx + 1));
        if ($k !== '') $out[$k] = $v;
    }
    return $out;
}

// ── Request-scoped auth ──────────────────────────────────────────────────

/**
 * Resolve the current user from the request's session cookie.
 * Returns ['email' => …, 'role' => …, 'token' => …] or null if anonymous.
 */
function current_user(): ?array {
    $cookies = parse_cookies();
    $token = $cookies[session_cookie_name()] ?? null;
    if (!$token) return null;
    $session = get_session($token);
    if (!$session) return null;
    $email = strtolower($session['email']);
    $dbRecord = get_user($email);
    $role = effective_role($email, $dbRecord);
    if (!$role) return null;  // user row gone → treat as logged out
    return ['email' => $email, 'role' => $role, 'token' => $token];
}

/**
 * Gate a handler on a role list. On failure: emits the right 4xx and exits.
 * On success: returns the resolved user array.
 *
 * @param string[] $allowedRoles
 */
function require_role(array $allowedRoles): array {
    $user = current_user();
    if (!$user) {
        unauthorized('Musíte byť prihlásený');
    }
    if (!in_array($user['role'], $allowedRoles, true)) {
        forbidden('Na túto akciu nemáte oprávnenie');
    }
    return $user;
}
