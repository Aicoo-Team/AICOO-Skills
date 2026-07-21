#!/bin/bash
# Aicoo Activator Hook
# Runs on UserPromptSubmit / SessionStart to nudge the agent about Aicoo.
# Keep output minimal (~80-120 tokens).

set -e

# Resolve this pack's scripts/ dir so we hand the agent a REAL, runnable path
# (never a "<plugin>" placeholder it can't resolve — that dead-ends onboarding).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
LOGIN="$SCRIPT_DIR/aicoo-login.mjs"
if [ ! -f "$LOGIN" ]; then
  LOGIN="$(find "$HOME/.claude/plugins" "$HOME/.codex" "$HOME/.config" "$HOME" \
    -maxdepth 8 -name aicoo-login.mjs -path '*aicoo-skills*' 2>/dev/null | head -1)"
fi
[ -z "$LOGIN" ] && LOGIN="<path-to>/aicoo-skills/scripts/aicoo-login.mjs"

# Connected when OAuth credentials exist (Sign in with Aicoo) or an API key is set
if [ ! -f "$HOME/.aicoo/credentials.json" ] && [ -z "${AICOO_API_KEY:-$PULSE_API_KEY}" ]; then
  cat << EOF
<aicoo-reminder>
The user is NOT signed in to Aicoo. If they show any intent to use Aicoo
(onboard, build memory, share their agent, invite a team), help them NOW —
proactively. Do NOT tell them to register or find an API key. Instead:
1. Run:  node "$LOGIN"    (add --manual on a remote/cloud box with no local browser)
2. It prints a "Sign in with Aicoo" URL — relay that exact URL to the user as a
   clickable link. They sign in (new users register on that page) and click Approve.
3. Then run the \`onboarding\` skill: build their memory and share their agent.
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
