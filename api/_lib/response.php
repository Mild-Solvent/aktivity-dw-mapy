<?php
/**
 * Tiny HTTP response helpers shared across all /api handlers.
 *
 * Direct port of api/_lib/response.js. Every helper emits JSON and ends
 * the request. Slovak messages preserved verbatim so the SPA's error
 * toasts stay identical.
 */

declare(strict_types=1);

function json_response(int $status, $body): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ok($body = ['ok' => true]): void { json_response(200, $body); }
function created($body): void              { json_response(201, $body); }
function badRequest(string $message): void { json_response(400, ['error' => $message]); }
function unauthorized(string $message = 'Neoprávnený prístup'): void {
    json_response(401, ['error' => $message]);
}
function forbidden(string $message = 'Prístup zamietnutý'): void {
    json_response(403, ['error' => $message]);
}
function notFound(string $message = 'Nenájdené'): void {
    json_response(404, ['error' => $message]);
}
function conflict(string $message): void { json_response(409, ['error' => $message]); }
/**
 * 429. Used by the password-reset endpoints, which are the only unauthenticated
 * routes that cause the server to send mail — without a limit they are a spam
 * relay aimed at our own sending reputation.
 */
function tooManyRequests(string $message = 'Príliš veľa požiadaviek. Skúste to neskôr.'): void {
    json_response(429, ['error' => $message]);
}
function serverError(string $message = 'Interná chyba servera'): void {
    json_response(500, ['error' => $message]);
}
