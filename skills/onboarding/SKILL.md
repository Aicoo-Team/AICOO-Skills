---
name: onboarding
description: "Use this skill when a user wants to set up Pulse for the first time, register for an API key, initialize their workspace, or teach their agent about themselves. Triggers on: 'set up Pulse', 'get started with Pulse', 'init', 'initialize', 'register', 'API key', 'teach my agent about me', 'what should my agent know', or any first-time Pulse usage."
metadata:
  author: systemind
  version: "1.0.0"
---

# Onboarding — First-Time Pulse Setup

You guide users through setting up Pulse from scratch: getting an API key, initializing their workspace, exploring their local environment, and teaching their agent who they are.

## Prerequisites

- Internet access (to register at pulse.systemind.com)
- A shell environment (Claude Code, Codex, OpenClaw, terminal)

---

## Phase 1: API Key Registration

### Check if already configured

```bash
echo "${PULSE_API_KEY:+Key is set (${#PULSE_API_KEY} chars)}" || echo "No key found"
```

If the key exists, skip to Phase 2.

### Guide the user to register

Tell the user:

> To use Pulse, you need an API key. Here's how:
>
> 1. Go to **https://pulse.systemind.com/settings/api-keys**
> 2. Click **"Generate Token"**
> 3. Copy the key (starts with `pulse_sk_live_...`)
> 4. Set it in your environment:
>    ```bash
>    export PULSE_API_KEY=pulse_sk_live_xxxxxxxx
>    ```
>
> For persistence, add it to your shell profile (`~/.zshrc`, `~/.bashrc`) or `.env` file.

### Verify the key works

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/init" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

Expected: `{"success": true, ...}` with folder tree and file counts.

---

## Phase 2: Initialize Workspace

### Run /init

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/init" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

This creates a `/General` folder if it's the first time, and returns the current workspace state.

### Check existing context

```bash
curl -s "https://api.pulse.systemind.com/v1/context/status" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

Look at `contextCount`, `folders`, and `lastSyncedAt` to understand what already exists.

---

## Phase 3: Local Exploration

This is the most important phase. You need to understand the user's environment to sync the right knowledge. Ask these questions and explore accordingly.

### Discovery Questions

Ask the user these questions (adapt based on context):

**About the user:**
1. "What's your role? (e.g., founder, engineer, researcher, student)"
2. "What do you want your shared agent to know about you?"
3. "Is there anything your agent should NOT share?"

**About their work:**
4. "What projects are you working on right now?"
5. "Are there local files or folders I should look at? (docs, READMEs, notes, resumes)"
6. "Do you have any documents you want your agent to be able to reference? (pitch decks, research, meeting notes)"

**About their audience:**
7. "Who will talk to your shared agent? (investors, colleagues, customers, friends)"
8. "What should those people be able to learn from your agent?"

### Explore Local Environment

Based on answers, scan relevant files:

```bash
# Look for common knowledge sources
ls -la README.md CLAUDE.md docs/ notes/ *.md 2>/dev/null

# Check git for project context
git log --oneline -10 2>/dev/null

# Look for package info
cat package.json 2>/dev/null | jq '{name, description, scripts}' 2>/dev/null

# Check for existing docs
find . -maxdepth 3 -name "*.md" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -20
```

### Build the About Me Note

From the exploration, create a comprehensive "About Me" note:

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_note",
    "params": {
      "title": "About Me",
      "content": "# [User Name]\n\n## Role\n[Role description]\n\n## Current Work\n[Projects and focus areas]\n\n## What I Want to Share\n[Key topics the agent should discuss]\n\n## Boundaries\n[What the agent should not discuss]",
      "folderName": "General"
    }
  }' | jq .
```

### Sync Local Files

For each relevant file or directory discovered:

```bash
# Read local file content
CONTENT=$(cat path/to/file.md)

# Upload to Pulse
curl -s -X POST "https://api.pulse.systemind.com/v1/accumulate" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg path "Technical/architecture.md" --arg content "$CONTENT" \
    '{files: [{path: $path, content: $content}]}')" | jq .
```

---

## Phase 4: Organize into Folders

Create folders that match the user's mental model:

```bash
# Create folders based on discovered categories
for folder in "General" "Technical" "Research" "Public"; do
  curl -s -X POST "https://api.pulse.systemind.com/v1/context/folders" \
    -H "Authorization: Bearer $PULSE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$folder\"}" | jq .status
done
```

### Suggested Folder Structures

**For a founder/startup:**
```
General/       → About me, team info, company overview
Public/        → Pitch deck, product description, press kit
Technical/     → Architecture, API docs, tech stack
Investors/     → Fundraising materials, metrics, vision
```

**For an engineer:**
```
General/       → About me, skills, interests
Technical/     → Project docs, architecture decisions
Research/      → Papers, notes, explorations
Work/          → Current projects, meeting notes
```

**For a researcher:**
```
General/       → Bio, research interests, CV
Research/      → Papers, findings, methodology
Public/        → Publications, talks, presentations
Teaching/      → Course materials, student resources
```

---

## Phase 5: Verify and Share

### Check what's been synced

```bash
curl -s "https://api.pulse.systemind.com/v1/context/status" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

### Create a test share link

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/share/create" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "all",
    "access": "read",
    "label": "Test link",
    "expiresIn": "1h"
  }' | jq .
```

Tell the user: "Open this link in an incognito window to see what guests experience."

### Suggest next steps

After onboarding, recommend:
1. **Set up autonomous sync** — keep your agent updated automatically (use `autonomous-sync` skill)
2. **Configure access levels** — share specific folders with different audiences (use `share-agent` skill)
3. **Enable snapshots** — version your knowledge before major updates (use `snapshots` skill)

---

## Quick Reference

| Phase | What Happens | Time |
|-------|-------------|------|
| 1. API Key | Register and set `PULSE_API_KEY` | 2 min |
| 2. Init | Create workspace, check existing state | 30 sec |
| 3. Explore | Ask questions, scan local files, build knowledge | 5-15 min |
| 4. Organize | Create folders, categorize content | 2 min |
| 5. Verify | Test share link, confirm setup | 1 min |
