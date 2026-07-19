#!/bin/bash
# Aicoo Activator Hook
# Triggers on UserPromptSubmit to remind about Aicoo capabilities
# Keep output minimal (~60-100 tokens)

set -e

# Connected when OAuth credentials exist (Sign in with Aicoo) or an API key is set
if [ ! -f "$HOME/.aicoo/credentials.json" ] && [ -z "${AICOO_API_KEY:-$PULSE_API_KEY}" ]; then
  cat << 'EOF'
<aicoo-reminder>
Not signed in to Aicoo. If the user wants to share their agent or sync knowledge in Aicoo:
→ Sign in with Aicoo (OAuth): node <plugin>/scripts/aicoo-login.mjs
→ Fallback: create an API key at https://www.aicoo.io/settings/api-keys and export AICOO_API_KEY
</aicoo-reminder>
EOF
  exit 0
fi

cat << 'EOF'
<aicoo-reminder>
Aicoo is connected. After completing this task, consider:
- Did the conversation produce knowledge worth syncing? → POST /os/notes/search, then create/edit note
- Should the shared agent know about this? → POST /accumulate or /os/notes
- Major changes coming? → POST /os/snapshots/{noteId} first
- Need to share with someone? → POST /os/share with scope + access control
</aicoo-reminder>
EOF
