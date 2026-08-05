# Websupport support request — PHP 8.5 not applying to aktivity.ceaeurope.sk

**Status:** blocking. Everything else in the migration is done and verified.

---

## 1. The problem in one paragraph

`aktivity.ceaeurope.sk` has a hosting service configured in the Websupport admin as
**Apache 2.4 PHP 8.5**, but the server actually executes scripts under **PHP 7.2.34**. The trail
app's backend is written for PHP 8, so every `/api/*` request dies with a fatal parse error and
returns `{"error":"Interná chyba servera"}`. The site's static side (the Vue app, images, GPX files)
works fine — it's only PHP that's broken.

This is a provisioning problem on Websupport's side. The setting is correct in the panel; it just
isn't being applied. Nothing on our end can force it.

---

## 2. Facts you'll need (have these ready)

| Thing | Value |
|---|---|
| Hosting package | `cea_1` (service 293221), domain `ceaeurope.sk` (service 293223) |
| Web service ID | **15898310** |
| Address | `aktivity.ceaeurope.sk` |
| Configured runtime | Apache 2.4 **PHP 8.5** |
| Root / source directory | `/ceaeurope.sk/sub/aktivity` |
| Actually served | `PHP 7.2.34-65+freexian22.04.1+php+1`, SAPI `fpm-fcgi` |
| Service created | 5 Aug 2026, ~15:33 CEST |
| Re-saved to force reprovision | ~15:41 CEST — no effect |
| Front proxy seen in headers | `openresty` |
| Error log | `~/ceaeurope.sk/sub/aktivity-php-errors.log` |
| Sample fatal | `syntax error, unexpected '_000' (T_STRING)` |

**Two facts that are useful ammunition:**

1. **Per-service PHP versions demonstrably work on this account already.** `ceaeurope.sk` runs
   PHP 7.2 while `eshopold.ceaeurope.sk` and `eliadminold.ceaeurope.sk` run PHP 7.4. So the feature
   isn't unsupported — it just isn't taking effect for the new service.
2. **PHP 8.5 exists on the platform.** The premium shell (`shell.r2.websupport.sk`) reports
   `PHP 8.5.7` from the command line. It's only the web SAPI that's stuck on 7.2.

The `_000` error is the giveaway: it's PHP 7.2 choking on `150_000`. Numeric separators only exist
from PHP 7.4 onward. That single line proves the request was executed by an old interpreter.

---

## 3. Message to send them

Websupport support works in Slovak. Paste this as-is.

```
Dobrý deň,

na hostingu cea_1 (doména ceaeurope.sk) mám vytvorenú službu pre subdoménu
aktivity.ceaeurope.sk:

  - ID služby: 15898310
  - Adresa: aktivity.ceaeurope.sk
  - Nastavená služba: Apache 2.4 PHP 8.5
  - Koreňový aj zdrojový adresár: /ceaeurope.sk/sub/aktivity

V administrácii je pri tejto službe uvedená verzia PHP 8.5, no server v
skutočnosti vykonáva skripty stále pod PHP 7.2.34. Overené priamym výpisom
PHP_VERSION cez HTTPS na aktivity.ceaeurope.sk, ktorý vracia:

  7.2.34-65+freexian22.04.1+php+1 (fpm-fcgi)

Službu som vytvoril 5.8.2026 o 15:33 a o 15:41 som ju znova uložil, aby sa
konfigurácia nanovo vygenerovala. Verzia PHP sa napriek tomu nezmenila ani po
viac ako hodine.

Aplikácia je napísaná pre PHP 8, takže pod PHP 7.2 končí fatálnou chybou,
napríklad "syntax error, unexpected '_000'" (číselné oddeľovače sú podporované
až od PHP 7.4). Celé API preto vracia chybu 500.

Podotýkam, že na tom istom hostingu už jednotlivé služby bežia na rôznych
verziách PHP (ceaeurope.sk = PHP 7.2, eshopold.ceaeurope.sk = PHP 7.4), takže
tento mechanizmus na účte funguje. Rovnako aj samotné PHP 8.5 je na platforme
dostupné - shell konzola hlási PHP 8.5.7.

Prosím o kontrolu, prečo sa pri službe aktivity.ceaeurope.sk neaplikuje
nastavená verzia PHP 8.5.

DÔLEŽITÉ: prosím nemeňte verziu PHP pre hlavnú doménu ceaeurope.sk a nezasahujte
do DNS zóny domény. Na doméne beží firemná pošta a starší web, ktoré musia
zostať nedotknuté. Zmena sa má týkať výhradne subdomény aktivity.ceaeurope.sk.

Ďakujem za pomoc.
```

---

## 4. Likely answers, and what to do with each

### "Počkajte, zmena sa prejaví do X minút / hodín"
Fine, but you've already waited over an hour with a re-save in between. Say so, and ask for a
concrete deadline. If it passes, reply on the same ticket rather than opening a new one.

### "Vyčistili sme cache / skúste teraz"
Re-run the verification in section 6. Check from a fresh connection or add a random query string —
don't trust a browser reload alone.

### "Verzia PHP pre podadresár sa dedí z hlavnej domény"
**This is the answer I'd bet on.** `/ceaeurope.sk/sub/aktivity` sits underneath the `ceaeurope.sk`
service, which is on PHP 7.2, so the subdirectory may be inheriting it despite having its own
service entry.

If they say this, ask: *"Ako viem prevádzkovať subdoménu na PHP 8.5 bez toho, aby som menil verziu
hlavnej domény?"* Reasonable options they may offer, in order of preference:
1. Decouple the service so the subdomain gets its own PHP-FPM pool — ideal, no other change.
2. Move the app out of `sub/` into its own top-level directory (e.g. `~/aktivity.ceaeurope.sk/`) with
   its own service. This is easy for us — it's one config line and a redeploy. **Accept this.**
3. Add it as a separate hosted domain. Also fine, as long as **no DNS records are created or
   modified** — `aktivity.ceaeurope.sk` already resolves correctly.

### "Musíte zmeniť verziu PHP pre celú doménu ceaeurope.sk na 8.x"
**Do not agree to this on the spot.** `ceaeurope.sk` runs an old WolfCMS site written for PHP 7.2;
jumping it to PHP 8 will very likely break the company's main website. It's also flagged
"Stará PHP verzia" in the panel, so it *should* be upgraded eventually — but as its own project,
with testing, not as a side effect of this ticket.

Reply: *"Hlavnú doménu zatiaľ meniť nechcem, beží na nej starší web. Potrebujem riešenie len pre
subdoménu."*

### "Subdoména nie je správne vytvorená / chýba DNS záznam"
It is, and it isn't missing. `aktivity.ceaeurope.sk` is an **A record → 37.9.175.155**, resolves
correctly, serves the Vue app over valid HTTPS from the wildcard certificate, and files are being
read from `/ceaeurope.sk/sub/aktivity`. If PHP were not running at all we'd get a download prompt or
a 404 — instead we get PHP 7.2 executing and failing. Say that.

### They ask for access or credentials
They already have full access to the hosting account. **Do not send passwords, the database
password, or the SSH key over the ticket.** If they need to test, they can use their own admin access.

---

## 5. Red lines — things that must not be touched

Say this explicitly if the conversation drifts. The domain carries the company's email.

- **No DNS changes.** Not MX, not TXT/SPF, not `autodiscover`/`autoconfig`, not the `mail`, `smtp`,
  `imap`, `pop3`, `mailin1`, `mailin2` records, not the nameservers. The one record this project
  needed (`aktivity`) is already correct.
- **No PHP version change on `ceaeurope.sk`** without a separate, tested plan.
- **No changes to the `ceaeurope.sk/web` directory** — that's the live WolfCMS site.
- **No changes to mailboxes or mail routing.**

A verified pre-change snapshot of every mail-related DNS record lives in `.backup/dns-before.txt`,
and `scripts/dns-email-check.ps1` regenerates it. If anything ever looks wrong with email, run the
script and diff against that file — it will show exactly what moved.

---

## 6. How to check whether it's fixed

Run this. It needs nothing installed beyond `curl`.

```bash
curl -s https://aktivity.ceaeurope.sk/api/trails
```

- **Fixed:** a JSON array starting `[{"id":"est-ut-perferendis"...` — that's the CEA 8,4 trail.
- **Still broken:** `{"error":"Interná chyba servera"}`.

Second check, confirming the interpreter itself:

```bash
curl -s https://aktivity.ceaeurope.sk/api/auth/me
```

- **Fixed:** `{"error":"Neprihlásený"}` — that's PHP 8 running correctly and telling you you're
  logged out, which is the expected answer for an anonymous visitor.
- **Still broken:** `{"error":"Interná chyba servera"}`.

If you want the underlying reason at any point, the PHP error log is on the server:

```bash
ssh -i ~/.ssh/aktivity_deploy_ed25519 -o Port=28478 uid92382@shell.r2.websupport.sk "tail -30 ceaeurope.sk/sub/aktivity-php-errors.log"
```

---

## 7. What happens once it's fixed

Tell me and I'll finish the remaining verification — it's about fifteen minutes of work:

1. Log in as `deletezajac@gmail.com` with the **existing** password (hashes were migrated verbatim,
   so no reset is needed) and confirm the admin panel loads.
2. Open the "CEA 8,4" trail; confirm the GPX downloads and the gallery images render.
3. Create a trail with diacritics in the name (e.g. "Kolačín test"), upload a GPX, confirm the
   preview generates and the files land in `tracks/kolacin-test/`.
4. Delete that trail and confirm the folder is actually removed — this is the regression test for a
   real bug fixed during the migration, where mismatched slugs orphaned files permanently.
5. Upload a file near the 25 MB cap.
6. Exercise the filter grid and role management.

After that passes, the last step is decommissioning: delete the Vercel Blob store, the Upstash Redis
store, and the `aktivity-dw-mapy` Vercel project — **leaving `cea-web` alone**, that's the separate
main company site. Until then Vercel stays untouched as a fallback.

---

## 8. Fallback if support can't resolve it

If Websupport genuinely cannot give the subdomain PHP 8, the options are, best first:

1. **Move the app to its own top-level directory** (`~/aktivity.ceaeurope.sk/`) with its own service.
   Cheap: one line in `.deploy.env`, one line in `scripts/deploy.sh`, and a redeploy.
2. **Ask which PHP 8.x versions *are* selectable** for this service — 8.0 through 8.4 would all work.
   The app needs 8.0 or newer, not specifically 8.5.
3. **Backport the code to PHP 7.2.** Technically possible — it's a handful of `str_contains`,
   `str_starts_with` and one numeric separator — but PHP 7.2 stopped receiving security patches in
   2020, so running a public login form on it is a bad trade. Treat this as a last resort.

---

## 9. Where the migration currently stands

Everything below is done and verified, so the PHP version is genuinely the only thing left.

- Vue SPA deployed and serving over HTTPS; deep links resolve through the router.
- MariaDB 11.4 database created, schema applied (`trails`, `users`, `sessions`).
- Data migrated from Upstash and Vercel Blob: 1 trail, 2 users, 104 media files (15 MB). Slovak
  diacritics survived intact; media URLs were rewritten from Vercel Blob to same-origin `/tracks/`
  paths, so nothing will break when Blob is deleted.
- Password hashes preserved verbatim — no account needs a reset.
- Security verified: `api/_lib/*`, `bootstrap.php`, `private/config.php` and `private/.htaccess` all
  return 403; directory listing is off.
- Slug logic unified and proven identical between browser and server, on both the `intl` path and
  the fallback path (16/16 fixtures each).
- **Company email verified untouched** — a full DNS diff against the pre-migration baseline shows no
  differences at all.
- Migration files containing password hashes deleted from both the server and the local machine.
