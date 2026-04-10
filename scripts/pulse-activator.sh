#!/bin/bash
# Pulse Activator Hook
# Triggers on UserPromptSubmit to remind about Pulse capabilities
# Keep output minimal (~60-100 tokens)

set -e

# Check if PULSE_API_KEY is set
if [ -z "$PULSE_API_KEY" ]; then
  cat << 'EOF'
<pulse-reminder>
PULSE_API_KEY is not set. If the user wants to share their agent or sync knowledge:
→ Guide them through onboarding: https://pulse.systemind.com/settings/api-keys
</pulse-reminder>
EOF
  exit 0
fi

cat << 'EOF'
<pulse-reminder>
Pulse is connected. After completing this task, consider:
- Did the conversation produce knowledge worth syncing? → search_notes, then create/edit
- Should the shared agent know about this? → accumulate or tools API
- Major changes coming? → save_snapshot first
- Need to share with someone? → share/create with scope + access control
</pulse-reminder>
EOF
