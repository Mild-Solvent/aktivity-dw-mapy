<?php
/**
 * POST /api/auth/forgot-password  {email}
 *
 * Emails a one-hour, single-use reset link.
 *
 * The response is IDENTICAL whether or not the address has an account, and
 * identical whether or not the mail actually sent. Any variation — a different
 * message, a different status, even a noticeably different response time — turns
 * this endpoint into a way to enumerate who has an account here.
 *
 * Because it is unauthenticated and causes the server to send mail, it is rate
 * limited by both email and IP before anything is sent.
 */

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../_lib/password_reset.php';
require_once __DIR__ . '/../_lib/mailer.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    badRequest('Metóda nie je podporovaná');
}

try {
    $body = read_json_body();
} catch (JsonException $e) {
    badRequest('Neplatný JSON');
}

$email = strtolower(trim((string) ($body['email'] ?? '')));

// The one thing worth rejecting outright: something that is not an address at
// all. This reveals nothing about who is registered.
if (!preg_match('/^[^@\s]+@[^@\s]+\.[^@\s]+$/', $email)) {
    badRequest('Neplatný e-mail');
}

// Deliberately vague and always the same.
const FORGOT_GENERIC_REPLY = 'Ak k tejto adrese existuje účet, poslali sme naň odkaz na obnovenie hesla. Skontrolujte si aj priečinok so spamom.';

$ip = request_ip();

if (reset_rate_limited($email, $ip)) {
    tooManyRequests('Príliš veľa pokusov o obnovenie hesla. Skúste to o hodinu.');
}

// Recorded for every request, existing account or not, so the rate limiter
// cannot itself be used to probe which addresses are real.
$token = create_reset_token($email, $ip);

if (get_user($email)) {
    $link = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'aktivity.ceaeurope.sk')
          . '/reset-password?token=' . rawurlencode($token);

    $subject = 'Obnovenie hesla — AKTIVITY DW KLUB';
    $text = <<<TXT
Dobrý deň,

pre svoj účet ({$email}) ste požiadali o obnovenie hesla.

Nové heslo si nastavíte na tomto odkaze:

{$link}

Odkaz je platný jednu hodinu a dá sa použiť iba raz.

Ak ste o obnovenie hesla nežiadali, tento e-mail pokojne ignorujte —
vaše heslo zostáva nezmenené.

AKTIVITY DW KLUB
TXT;

    // Return value ignored on purpose: a failed send must not change the
    // response. send_mail() logs the real reason server-side.
    send_mail($email, $subject, $text);
}

ok(['message' => FORGOT_GENERIC_REPLY]);
