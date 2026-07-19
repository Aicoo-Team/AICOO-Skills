#!/bin/bash
# Aicoo Skills — print an auth token for API calls.
#
# Prefers OAuth credentials (auto-refreshed via aicoo-token.mjs); falls back
# to AICOO_API_KEY / PULSE_API_KEY. Usage in scripts:
#
#   TOKEN="$("$SCRIPT_DIR/aicoo-auth.sh")" || exit 1
#   AUTH="Authorization: Bearer $TOKEN"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TOKEN=""
if command -v node >/dev/null 2>&1; then
  TOKEN="$(node "$SCRIPT_DIR/aicoo-token.mjs" 2>/dev/null || true)"
fi

if [ -z "$TOKEN" ]; then
  TOKEN="${AICOO_API_KEY:-${PULSE_API_KEY:-}}"
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: not signed in to Aicoo. Run 'node $SCRIPT_DIR/aicoo-login.mjs' (or export AICOO_API_KEY)." >&2
  exit 1
fi

printf '%s' "$TOKEN"
