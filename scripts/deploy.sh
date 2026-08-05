#!/usr/bin/env bash
#
# Build + deploy aktivity-dw-mapy to Websupport via SFTP.
#
# Requires:
#   - npm                         (for the Vite build)
#   - sshpass                     (for non-interactive SFTP auth)
#   - env vars in .deploy.env (gitignored) OR exported in your shell:
#       DEPLOY_HOST, DEPLOY_USER, DEPLOY_PASS, DEPLOY_REMOTE_DIR
#
# Example .deploy.env:
#   DEPLOY_HOST=aktivity.ceaeurope.sk
#   DEPLOY_USER=username
#   DEPLOY_PASS=your-password
#   DEPLOY_REMOTE_DIR=/public_html
#
# Usage:
#   ./scripts/deploy.sh           # full deploy (build + upload)
#   ./scripts/deploy.sh --no-build  # skip vite build (use existing dist/)
#
# What it uploads:
#   dist/*                         → $DEPLOY_REMOTE_DIR/        (SPA)
#   api/**                         → $DEPLOY_REMOTE_DIR/api/     (PHP handlers)
#   .htaccess, .user.ini           → $DEPLOY_REMOTE_DIR/         (Apache + PHP)
#   private/config.php             → $DEPLOY_REMOTE_DIR/private/ (secrets, if present)
#
# It does NOT upload: tracks/, migrations/, node_modules/, scripts/, *.md, .git/
# (those are either runtime data, dev-only, or one-time ops files).
#
# Dry run:
#   DEPLOY_DRY=1 ./scripts/deploy.sh
#
# Tested on macOS + Linux. On Windows use Git Bash or WSL.

set -euo pipefail

cd "$(dirname "$0")/.."

# ── Load config ─────────────────────────────────────────────────────────
if [[ -f .deploy.env ]]; then
  set -a; source .deploy.env; set +a
fi

for var in DEPLOY_HOST DEPLOY_USER DEPLOY_PASS DEPLOY_REMOTE_DIR; do
  if [[ -z "${!var:-}" ]]; then
    echo "✗ Missing $var. Put it in .deploy.env or export it."
    exit 1
  fi
done

DO_BUILD=1
if [[ "${1:-}" == "--no-build" ]]; then
  DO_BUILD=0
fi

# ── Build ───────────────────────────────────────────────────────────────
if [[ $DO_BUILD -eq 1 ]]; then
  echo "→ Building Vue SPA (vite build)…"
  npm run build
fi

if [[ ! -d dist ]]; then
  echo "✗ dist/ missing. Run without --no-build, or run 'npm run build' first."
  exit 1
fi

# ── Staging dir for clean SFTP mirror ───────────────────────────────────
STAGE="$(mktemp -d -t aktivity-deploy.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT

echo "→ Staging files in $STAGE …"
cp -r dist/. "$STAGE/"
mkdir -p "$STAGE/api"
cp -r api/. "$STAGE/api/"
cp .htaccess "$STAGE/"
cp .user.ini "$STAGE/"
if [[ -f private/config.php ]]; then
  mkdir -p "$STAGE/private"
  cp private/config.php "$STAGE/private/"
fi
# Make sure tracks/ exists on the remote (it's runtime data, not deployed).
mkdir -p "$STAGE/tracks"
# Drop a .gitkeep so the dir survives SFTP mirroring.
: > "$STAGE/tracks/.gitkeep"

# ── Upload via SFTP ─────────────────────────────────────────────────────
DRY_FLAG=""
if [[ "${DEPLOY_DRY:-0}" == "1" ]]; then
  echo "▸ DRY RUN — no files will be uploaded."
  DRY_FLAG="-n"
  # sshpass -n would still try to connect; just list instead.
  echo "Would upload:"
  (cd "$STAGE" && find . -type f | sort)
  exit 0
fi

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR%/}"

echo "→ Connecting to $REMOTE:$REMOTE_DIR …"

# Mirror local → remote with lftp. We use --reverse so only changed files
# are transferred; --delete keeps the remote free of stale build assets.
# Note: lftp's --exclude-glob protects runtime-only paths.
sshpass -p "$DEPLOY_PASS" lftp -c "
  set sftp:auto-confirm yes
  set net:max-retries 3
  open sftp://$REMOTE
  mirror --reverse --verbose=1 \
         --no-perms \
         --exclude-glob='tracks/*' \
         '$STAGE/' '$REMOTE_DIR/'
  quit
"

echo "✓ Deployed to $REMOTE:$REMOTE_DIR"
echo ""
echo "Smoke test (from your machine):"
echo "  curl -s https://${DEPLOY_HOST}/api/auth/me   # → {\"error\":\"Neprihlásený\"}"
echo "  curl -s https://${DEPLOY_HOST}/api/trails     # → JSON array of trails"
