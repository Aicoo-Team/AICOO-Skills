---
name: autonomous-sync
description: "Use this skill when the user wants to keep their Pulse agent updated automatically, set up scheduled syncs, configure triggers for knowledge updates, use CRON jobs, /loop commands, file watchers, or hooks to push changes to Pulse. Triggers on: 'auto sync', 'keep updated', 'schedule', 'CRON', 'loop', 'trigger', 'watch files', 'auto update', 'periodic sync', 'hook', 'autonomous'."
metadata:
  author: systemind
  version: "1.0.0"
---

# Autonomous Sync — Keep Your Agent Updated

Set up automatic triggers to keep your Pulse agent's knowledge current. Choose from rule-based schedules (CRON, /loop) or event-driven triggers (hooks, file watchers).

## Prerequisites

- `PULSE_API_KEY` environment variable must be set
- Base URL: `https://api.pulse-ai.world/v1`
- Initial context already synced (use `onboarding` skill first)

---

## Strategy 1: Rule-Based (Scheduled)

### For Claude Code: `/loop` Command

The simplest way to keep your agent updated. Run inside Claude Code:

```
/loop 30m sync any new knowledge to Pulse — review our recent conversation for decisions, preferences, project updates, and meeting outcomes. Search existing notes first to avoid duplicates. Use edit_note to update existing notes, create_note for new topics. Save snapshots before major edits.
```

**Recommended intervals:**
| Use Case | Interval | Prompt |
|----------|----------|--------|
| Active development | `15m` | Focus on technical decisions and code changes |
| Meeting notes | `30m` | Capture decisions and action items |
| Daily summary | `2h` | Broader project updates and learnings |
| Low-touch monitoring | `6h` | Check for stale content, update if needed |

**Advanced /loop with specific focus:**

```
/loop 1h check these files for changes and sync to Pulse if modified: README.md, docs/*, CHANGELOG.md. Use accumulate for bulk updates. Save snapshots before overwriting.
```

### For OpenClaw: CRON Jobs

Create a daily CRON job that triggers a Pulse sync session:

**Option A: Direct API call via cron**

```bash
# Add to crontab: crontab -e
# Runs daily at 9 AM — syncs project status to Pulse
0 9 * * * /path/to/pulse-sync.sh >> /tmp/pulse-sync.log 2>&1
```

**pulse-sync.sh:**
```bash
#!/bin/bash
set -e

PULSE_BASE="https://api.pulse-ai.world/v1"
AUTH="Authorization: Bearer $PULSE_API_KEY"

# Check staleness
STATUS=$(curl -s "$PULSE_BASE/context/status" -H "$AUTH")
LAST_SYNC=$(echo "$STATUS" | jq -r '.lastSyncedAt // "never"')
echo "[$(date)] Last sync: $LAST_SYNC"

# Gather local changes
cd /path/to/project
CHANGES=$(git log --oneline --since="24 hours ago" 2>/dev/null || echo "no git")

if [ "$CHANGES" != "no git" ] && [ -n "$CHANGES" ]; then
  # Build summary
  SUMMARY="# Daily Update — $(date +%Y-%m-%d)\n\n## Recent Changes\n\n$CHANGES"

  # Sync via accumulate
  curl -s -X POST "$PULSE_BASE/accumulate" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg content "$SUMMARY" \
      '{files: [{path: "Technical/daily-update.md", content: $content}]}')"

  echo "[$(date)] Synced daily update"
fi
```

**Option B: OpenClaw scheduled session**

```bash
# In OpenClaw, create a recurring task
openclaw schedule create \
  --cron "0 9 * * *" \
  --task "Review recent work and sync important updates to Pulse. Check what already exists first, then create or update notes as needed." \
  --label "pulse-daily-sync"
```

### For Codex / Other Agents

Use system cron to trigger the agent with a sync prompt:

```bash
# crontab -e
0 */4 * * * codex --prompt "Sync any recent project changes to Pulse" --quiet
```

---

## Strategy 2: Event-Driven (Hooks)

### Claude Code Hooks

Add to `.claude/settings.json` in your project:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "./pulse-skills/scripts/sync-detector.sh"
          }
        ]
      }
    ]
  }
}
```

This triggers after file writes/edits, reminding the agent to consider syncing changes to Pulse.

**sync-detector.sh** (included in `scripts/`):
```bash
#!/bin/bash
# Detects file changes and suggests Pulse sync
cat << 'EOF'
<pulse-sync-reminder>
A file was just modified. If this change represents:
- A decision or architectural choice
- Updated documentation or specs
- New knowledge the shared agent should have

Consider syncing to Pulse:
1. Search existing notes: POST /tools {"tool": "search_notes", "params": {"query": "<topic>"}}
2. Update or create note via tools API
3. Save snapshot before major edits
</pulse-sync-reminder>
EOF
```

### OpenClaw Hooks

Copy the hook to OpenClaw's hooks directory:

```bash
cp -r pulse-skills/hooks/openclaw ~/.openclaw/hooks/pulse-sync
openclaw hooks enable pulse-sync
```

The hook fires on `agent:bootstrap`, injecting a reminder to check if Pulse context is stale.

### Git Hooks (post-commit)

Trigger a sync after every commit:

```bash
# .git/hooks/post-commit
#!/bin/bash
COMMIT_MSG=$(git log -1 --pretty=format:"%s")
COMMIT_HASH=$(git log -1 --pretty=format:"%h")

# Only sync meaningful commits (skip WIP, fixup, etc.)
if [[ "$COMMIT_MSG" =~ ^(feat|fix|docs|refactor) ]]; then
  curl -s -X POST "https://api.pulse-ai.world/v1/accumulate" \
    -H "Authorization: Bearer $PULSE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg path "Technical/commits/$(date +%Y-%m-%d).md" \
      --arg content "## $COMMIT_HASH: $COMMIT_MSG\n\n$(git diff-tree --no-commit-id --name-only -r HEAD | head -10)" \
      '{files: [{path: $path, content: $content}]}')" &
fi
```

### File Watcher (fswatch/watchman)

Watch specific directories and sync on change:

```bash
# Using fswatch (macOS)
fswatch -o docs/ notes/ README.md | while read; do
  echo "[$(date)] Change detected, syncing..."
  # Read changed files and accumulate
  for f in $(find docs/ notes/ -newer /tmp/.pulse-last-sync -name "*.md" 2>/dev/null); do
    FILES+=("$(jq -n --arg path "Technical/$(basename $f)" --arg content "$(cat $f)" \
      '{path: $path, content: $content}')")
  done

  if [ ${#FILES[@]} -gt 0 ]; then
    curl -s -X POST "https://api.pulse-ai.world/v1/accumulate" \
      -H "Authorization: Bearer $PULSE_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"files\": [$(IFS=,; echo "${FILES[*]}")]}"
  fi
  touch /tmp/.pulse-last-sync
done
```

---

## Strategy 3: Conversation-Driven (Post-Chat Sync)

After every substantive conversation, sync key takeaways:

### The Sync Checklist

After completing a task or conversation, ask yourself:

1. **Decisions made?** → Create/update note in relevant folder
2. **Preferences expressed?** → Update "About Me" or preferences note
3. **New project context?** → Add to project-specific folder
4. **Meeting outcomes?** → Create meeting notes entry
5. **Technical choices?** → Update architecture/tech docs

### Implementation

```bash
# 1. Search for existing note on the topic
curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_notes", "params": {"query": "database migration strategy"}}' | jq .

# 2a. If found, snapshot then edit
curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "save_snapshot", "params": {"noteId": 42, "label": "Pre-update"}}' | jq .

curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "edit_note", "params": {"id": 42, "content": "# Updated content..."}}' | jq .

# 2b. If not found, create new
curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "create_note", "params": {"title": "DB Migration Strategy", "content": "...", "folderName": "Technical"}}' | jq .
```

---

## Staleness Detection

Check how fresh your agent's knowledge is:

```bash
curl -s "https://api.pulse-ai.world/v1/context/status" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq '{lastSyncedAt, contextCount}'
```

**Staleness thresholds:**
| Last Synced | Status | Action |
|-------------|--------|--------|
| < 1 hour | Fresh | No action needed |
| 1-24 hours | Slightly stale | Sync if conversation had updates |
| 1-7 days | Stale | Review and sync recent work |
| > 7 days | Very stale | Full re-sync recommended |

---

## Choosing Your Strategy

| If you... | Use |
|-----------|-----|
| Use Claude Code daily | `/loop 30m` + PostToolUse hook |
| Use OpenClaw | CRON job (daily) + bootstrap hook |
| Want zero-touch automation | File watcher + git post-commit hook |
| Prefer manual control | Conversation-driven sync after important chats |
| Want maximum coverage | Combine: `/loop` + hooks + post-commit |

---

## Quick Setup Checklist

- [ ] `PULSE_API_KEY` is set and persistent (in shell profile)
- [ ] Initial context is synced (`onboarding` skill completed)
- [ ] At least one trigger is configured:
  - [ ] `/loop` command running in Claude Code
  - [ ] CRON job scheduled (for OpenClaw/standalone)
  - [ ] Hook script installed (Claude Code `.claude/settings.json`)
  - [ ] File watcher running (for docs-heavy projects)
- [ ] Snapshot-before-edit pattern is understood
