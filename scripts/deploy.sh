#!/usr/bin/env bash
#
# Build + deploy aktivity-dw-mapy to Websupport over SFTP.
#
# Uses only the OpenSSH client that ships with Windows, macOS and Linux — the
# previous version needed sshpass + lftp, neither of which exists on the
# Windows machine this is deployed from. Authentication is by SSH key, so no
# password is stored anywhere.
#
# Requires .deploy.env (gitignored):
#
#   DEPLOY_HOST=shell.r2.websupport.sk
#   DEPLOY_PORT=28478
#   DEPLOY_USER=uid92382
#   DEPLOY_KEY=~/.ssh/id_ed25519
#   DEPLOY_REMOTE_DIR=aktivity.ceaeurope.sk/web
#
# Usage:
#   ./scripts/deploy.sh              # build + upload
#   ./scripts/deploy.sh --no-build   # upload existing dist/
#   DEPLOY_DRY=1 ./scripts/deploy.sh # list what would be uploaded, touch nothing
#
# Uploads: dist/*, api/**, .htaccess, .user.ini, private/config.php
# Never uploads: tracks/ (runtime data), migrations/, node_modules/, .git/
#
# It uploads rather than mirrors — nothing on the server is deleted. Stale
# build assets from an older Vite hash accumulate; that is deliberate, because
# a delete-capable deploy pointed at the wrong directory is the one mistake
# that could take out company email, which lives on the same account.

set -euo pipefail

cd "$(dirname "$0")/.."

# ── Config ──────────────────────────────────────────────────────────────
# Values already present in the environment win over .deploy.env, so a one-off
# `DEPLOY_REMOTE_DIR=... ./scripts/deploy.sh` does what it looks like it does.
# (Sourcing the file wholesale would silently overwrite the override — which
# also made the blast-radius guard untestable.)
if [[ -f .deploy.env ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [[ -n "${!key:-}" ]] && continue
    export "$key=$value"
  done < <(grep -vE '^[[:space:]]*(#|$)' .deploy.env)
fi

: "${DEPLOY_PORT:=22}"
: "${DEPLOY_KEY:=$HOME/.ssh/id_ed25519}"

for var in DEPLOY_HOST DEPLOY_USER DEPLOY_REMOTE_DIR; do
  if [[ -z "${!var:-}" ]]; then
    echo "✗ Missing $var. Put it in .deploy.env or export it." >&2
    exit 1
  fi
done

# ── Blast radius guard ──────────────────────────────────────────────────
# This account also hosts ceaeurope.sk (a live WolfCMS site) and the company
# mailboxes. Refuse to run against anything but this project's own docroot.
EXPECTED_ROOT="aktivity.ceaeurope.sk/web"
REMOTE_DIR="${DEPLOY_REMOTE_DIR#/}"       # tolerate a leading slash
REMOTE_DIR="${REMOTE_DIR%/}"              # and a trailing one

if [[ "$REMOTE_DIR" == *..* ]] \
   || { [[ "$REMOTE_DIR" != "$EXPECTED_ROOT" ]] && [[ "$REMOTE_DIR" != "$EXPECTED_ROOT"/* ]]; }; then
  cat >&2 <<EOF
✗ Refusing to deploy to '$REMOTE_DIR'.

  DEPLOY_REMOTE_DIR must be '$EXPECTED_ROOT' or a path beneath it. Sibling
  directories on this account hold the live ceaeurope.sk WolfCMS site and the
  company mail data, and this script is not allowed near them.

  To target somewhere else, edit EXPECTED_ROOT in this script deliberately.
EOF
  exit 1
fi

# Expand ~ in the key path (source'ing .deploy.env does not).
DEPLOY_KEY="${DEPLOY_KEY/#\~/$HOME}"
if [[ ! -f "$DEPLOY_KEY" ]]; then
  echo "✗ SSH key not found at $DEPLOY_KEY" >&2
  exit 1
fi

SSH_OPTS=(-i "$DEPLOY_KEY" -p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=accept-new)

# ── Build ───────────────────────────────────────────────────────────────
if [[ "${1:-}" != "--no-build" ]]; then
  echo "→ Building Vue SPA…"
  npm run build
fi

if [[ ! -d dist ]]; then
  echo "✗ dist/ missing. Run without --no-build, or run 'npm run build' first." >&2
  exit 1
fi

# ── Stage ───────────────────────────────────────────────────────────────
STAGE="$(mktemp -d 2>/dev/null || mktemp -d -t aktivity-deploy)"
trap 'rm -rf "$STAGE"' EXIT

echo "→ Staging in $STAGE …"
cp -r dist/. "$STAGE/"
mkdir -p "$STAGE/api"
cp -r api/. "$STAGE/api/"
cp .htaccess .user.ini "$STAGE/"
if [[ -f private/config.php ]]; then
  mkdir -p "$STAGE/private"
  cp private/config.php "$STAGE/private/"
  [[ -f private/.htaccess ]] && cp private/.htaccess "$STAGE/private/"
else
  echo "  ! private/config.php not found — deploying without it (API will 500 until it exists)"
fi

FILE_COUNT=$(cd "$STAGE" && find . -type f | wc -l | tr -d ' ')

if [[ "${DEPLOY_DRY:-0}" == "1" ]]; then
  echo "▸ DRY RUN — nothing will be uploaded."
  echo "  target: $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_DIR  ($FILE_COUNT files)"
  (cd "$STAGE" && find . -type f | sort | sed 's|^\./|  |')
  exit 0
fi

# ── Upload ──────────────────────────────────────────────────────────────
echo "→ Uploading $FILE_COUNT files to $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_DIR …"

# sftp's `put -r` will not create missing intermediate directories, so build
# the tree first. -f on mkdir is not portable here; ignore "already exists".
BATCH="$STAGE.sftp"
{
  echo "cd $REMOTE_DIR"
  (cd "$STAGE" && find . -type d ! -name '.' | sed 's|^\./||' | sort) \
    | while read -r d; do echo "-mkdir $d"; done
  (cd "$STAGE" && find . -type f | sed 's|^\./||' | sort) \
    | while read -r f; do echo "put \"$STAGE/$f\" \"$f\""; done
} > "$BATCH"
trap 'rm -rf "$STAGE" "$BATCH"' EXIT

sftp "${SSH_OPTS[@]}" -b "$BATCH" "$DEPLOY_USER@$DEPLOY_HOST"

# tracks/ holds uploaded GPX and photos. Create it if absent; never touch it
# otherwise.
ssh "${SSH_OPTS[@]}" "$DEPLOY_USER@$DEPLOY_HOST" \
  "mkdir -p '$REMOTE_DIR/tracks' && chmod 775 '$REMOTE_DIR/tracks'"

echo "✓ Deployed to $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_DIR"
echo ""
echo "Smoke test:"
echo "  curl -s https://aktivity.ceaeurope.sk/api/auth/me    # {\"error\":\"Neprihlásený\"}"
echo "  curl -s https://aktivity.ceaeurope.sk/api/trails      # JSON array"
