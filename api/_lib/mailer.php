<?php
/**
 * Outbound mail, via authenticated SMTP submission to Websupport.
 *
 * WHY SMTP AND NOT mail():
 * `sendmail_path` on these hosts points at /usr/sbin/sendmail, which does not
 * exist, and localhost:25 is closed. Even if it worked, mail injected locally
 * would leave from the web server's IP — which is NOT covered by the domain's
 * SPF record (`v=spf1 a mx include:_spf.m1.websupport.sk ?all`), so password
 * resets would land in spam.
 *
 * Relaying through smtp.ceaeurope.sk goes out via hosts already inside that
 * `include:`, so mail passes SPF with NO DNS CHANGE. Nothing here touches MX,
 * SPF, DKIM, DMARC, autoconfig, or any existing mailbox — sending mail and
 * receiving it are separate concerns, and the company's inbound mail is
 * unaffected by anything in this file.
 *
 * Credentials live in private/config.php (gitignored, denied by .htaccess),
 * alongside the database password.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/phpmailer/Exception.php';
require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php';
require_once __DIR__ . '/vendor/phpmailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP as PHPMailerSMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

/** True when SMTP_* is configured; lets callers degrade instead of fataling. */
function mailer_configured(): bool {
    return defined('SMTP_HOST') && SMTP_HOST !== ''
        && defined('SMTP_USER') && SMTP_USER !== ''
        && defined('SMTP_PASSWORD') && SMTP_PASSWORD !== '';
}

/**
 * Send a plain-text UTF-8 message.
 *
 * Returns true on success. Never throws: every caller so far is a public
 * endpoint whose response must not vary with mail success, or it becomes an
 * account-enumeration oracle. Failures are logged instead.
 */
function send_mail(string $to, string $subject, string $body): bool {
    if (!mailer_configured()) {
        error_log('[mailer] SMTP_* not configured in private/config.php — mail not sent');
        return false;
    }

    $mail = new PHPMailer(true);   // exceptions on, caught below
    try {
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->Port       = defined('SMTP_PORT') ? (int) SMTP_PORT : 465;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASSWORD;
        // 465 is implicit TLS; 587 upgrades via STARTTLS.
        $mail->SMTPSecure = $mail->Port === 587
            ? PHPMailer::ENCRYPTION_STARTTLS
            : PHPMailer::ENCRYPTION_SMTPS;
        // A hung relay must not hold a web request open.
        $mail->Timeout    = 10;
        $mail->SMTPDebug  = PHPMailerSMTP::DEBUG_OFF;

        // UTF-8 throughout: subjects carry Slovak diacritics and have to be
        // RFC 2047 encoded-word wrapped, which is the main reason this uses a
        // library rather than hand-rolled SMTP.
        $mail->CharSet  = PHPMailer::CHARSET_UTF8;
        $mail->Encoding = PHPMailer::ENCODING_BASE64;

        $from     = defined('SMTP_FROM') && SMTP_FROM !== '' ? SMTP_FROM : SMTP_USER;
        $fromName = defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : 'ACTIVITY DW Club';
        $mail->setFrom($from, $fromName);
        $mail->addAddress($to);

        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (PHPMailerException $e) {
        // ErrorInfo carries the SMTP conversation detail; $e->getMessage() alone
        // is usually just "SMTP Error: Could not authenticate."
        error_log('[mailer] send failed: ' . $mail->ErrorInfo);
        return false;
    } catch (Throwable $e) {
        error_log('[mailer] unexpected failure: ' . $e->getMessage());
        return false;
    }
}
