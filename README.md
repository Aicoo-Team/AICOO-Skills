# Pulse Agent Skills

> Share your AI agent securely with anyone. Let others talk to your agent via a link — you control exactly what it can share, create, and edit.

## Quick Start

### 1. Install

```bash
# Clone into your Claude Code plugins directory
git clone https://github.com/Pulse-AI-Team/pulse-skills.git \
  ~/.claude/plugins/pulse-skills

# Restart Claude Code
```

### 2. Get your API key

1. Go to [aicoo.io/settings/api-keys](https://www.aicoo.io/settings/api-keys)
2. Click "Generate Token"
3. Copy the `pulse_sk_live_...` key
4. See [API docs](https://www.aicoo.io/docs/api) for full reference

### 3. Set your token

```bash
export PULSE_API_KEY=pulse_sk_live_xxxxxxxx
```

Or add to your `.env` / shell profile for persistence.

### 4. Use it

Just talk to Claude naturally:

```
> "Set up Pulse and teach my agent about me"
> "Sync my docs folder and share it with investors"
> "Create a share link with write access for my team"
> "Save a snapshot of my roadmap note before editing"
> "Set up auto-sync to keep my agent updated"
> "Check what my investor link is sharing — any sensitive data?"
> "How many people have talked to my shared agent?"
```

Skills activate automatically when relevant.

## Available Skills

| Skill | What it does |
|-------|-------------|
| **onboarding** | Guided first-time setup: API key, workspace init, local exploration, knowledge sync |
| **context-sync** | Upload files, search/read/create/edit notes, browse folders, manage versions |
| **share-agent** | Create shareable links with fine-grained access (notes read/write/edit, calendar) |
| **examine-sandbox** | Inspect what data a share link exposes, audit permissions, scan for sensitive content |
| **snapshots** | Save, list, and restore note versions — backup before edits, rollback mistakes |
| **autonomous-sync** | Auto-update triggers: CRON, /loop, hooks, file watchers, post-chat sync |

## How It Works

```
You (CLI) ──→ Pulse API ──→ Your Agent (with sandboxed context)
                                  │
                        Guest opens link ──→ Talks to your agent
                                             (only sees what you allowed)
                                             (can create/edit if permitted)
```

1. **Onboard**: Register API key and teach your agent about you
2. **Sync context**: Upload files, notes, or text to Pulse
3. **Create a link**: Choose scope, calendar access, and notes permissions
4. **Share it**: Send the link to anyone — no sign-up required
5. **Keep updated**: Set up auto-sync via /loop, CRON, or hooks
6. **Monitor**: Check analytics and audit what's being shared

## Project Structure

```
pulse-skills/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── onboarding/           # First-time setup guide
│   │   ├── SKILL.md
│   │   └── examples/
│   ├── context-sync/         # Knowledge sync & management
│   │   ├── SKILL.md
│   │   ├── reference/API.md
│   │   └── examples/
│   ├── share-agent/          # Share link creation & management
│   │   ├── SKILL.md
│   │   ├── reference/API.md
│   │   └── examples/
│   ├── examine-sandbox/      # Privacy audit & inspection
│   │   ├── SKILL.md
│   │   ├── reference/API.md
│   │   └── examples/
│   ├── snapshots/            # Note versioning
│   │   └── SKILL.md
│   └── autonomous-sync/      # Auto-update triggers
│       └── SKILL.md
├── hooks/
│   ├── claude-code/          # Hook configs for Claude Code
│   └── openclaw/             # Hook handler for OpenClaw
│       ├── HOOK.md
│       ├── handler.ts
│       └── handler.js
├── scripts/
│   ├── pulse-activator.sh    # UserPromptSubmit hook
│   ├── sync-detector.sh      # PostToolUse hook
│   └── pulse-sync.sh         # Standalone CRON sync script
├── CLAUDE.md
├── SKILL.md
├── README.md
└── LICENSE
```

## Automation Setup

### Claude Code (hooks)

```json
// .claude/settings.json
{
  "hooks": {
    "UserPromptSubmit": [{
      "matcher": "",
      "hooks": [{"type": "command", "command": "./pulse-skills/scripts/pulse-activator.sh"}]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{"type": "command", "command": "./pulse-skills/scripts/sync-detector.sh"}]
    }]
  }
}
```

### Claude Code (/loop)

```
/loop 30m sync any new knowledge to Pulse
```

### OpenClaw (hook + CRON)

```bash
cp -r pulse-skills/hooks/openclaw ~/.openclaw/hooks/pulse-sync
openclaw hooks enable pulse-sync
```

### Standalone (cron)

```bash
# crontab -e
0 9 * * * /path/to/pulse-skills/scripts/pulse-sync.sh /path/to/project
```

## API Base URL

```
https://www.aicoo.io/api/v1
```

All requests require `Authorization: Bearer <PULSE_API_KEY>`.

## License

MIT
