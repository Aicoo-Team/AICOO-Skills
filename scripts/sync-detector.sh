#!/bin/bash
# Pulse Sync Detector Hook
# Triggers on PostToolUse (Write/Edit) to remind about Pulse sync
# Keep output minimal (~50-80 tokens) to minimize overhead

set -e

cat << 'EOF'
<pulse-sync-reminder>
A file was just modified. If this represents important knowledge:
- Decision or architectural choice? → sync to Pulse
- Updated docs or specs? → accumulate to Pulse
- User preference or project context? → update existing Pulse note

Steps: POST /os/notes/search first → PATCH /os/notes/{id} or POST /os/notes → POST /os/snapshots/{noteId} before major edits.
</pulse-sync-reminder>
EOF
