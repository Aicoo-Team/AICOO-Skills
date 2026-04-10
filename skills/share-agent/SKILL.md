---
name: share-agent
description: "Use this skill when the user wants to share their AI agent with someone, generate a shareable link, let others talk to their agent, configure write access for guests, or manage existing shared links. Triggers on: 'share link', 'agent link', 'share my agent', 'let them talk to my AI', 'write access', 'edit access', 'guest permissions', or wanting to create a link for investors, prospects, partners, or anyone else to interact with their AI assistant."
metadata:
  author: systemind
  version: "1.0.0"
---

# Share Agent

You help users create secure, shareable links to their Pulse AI agent. Recipients can talk to the user's agent via the link without creating an account. Links use short 10-character tokens for elegant URLs.

## Prerequisites

- `PULSE_API_KEY` environment variable must be set
- Base URL: `https://api.pulse.systemind.com/v1`
- User should have synced context first (use `context-sync` skill if no context exists)

## Core Workflow

### Step 1: Check if context exists

```bash
curl -s -H "Authorization: Bearer $PULSE_API_KEY" \
  "https://api.pulse.systemind.com/v1/context/status" | jq .
```

If `contextCount` is 0, tell the user to sync context first.

### Step 2: Create a Share Link

Ask the user what they want to share and with whom. Then configure:

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/share/create" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "all",
    "access": "read",
    "notesAccess": "read",
    "label": "For investors",
    "expiresIn": "7d"
  }' | jq .
```

**Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `scope` | `"all"` or `"folders"` | What context to share. `"folders"` requires `folderIds` |
| `access` | `"read"`, `"read_calendar"`, `"read_calendar_write"` | Calendar access level |
| `notesAccess` | `"read"`, `"write"`, `"edit"` | Notes permission level (default: `"read"`) |
| `label` | any string | Friendly name (e.g., "For investors") |
| `expiresIn` | `"1h"`, `"24h"`, `"7d"`, `"30d"`, `null` | Expiration (null = no expiry) |
| `folderIds` | array of ints | Required when `scope` is `"folders"` |

**Response:** Returns `shareLink.url` (e.g., `https://pulse-ai.world/a/xK9mPq2RvT`) and `shareLink.agentUrl`. Present this prominently.

### Step 3: Confirm to user

After creating, tell the user:
1. The URL they can share
2. What scope/access is configured
3. When it expires (if set)
4. That recipients do NOT need an account
5. That the agent is sandboxed — it only shares what's in scope

---

## Notes Access Levels

The `notesAccess` parameter controls what guests can do with notes:

| Level | Guest Can | Use Case |
|-------|-----------|----------|
| `read` | Search and read notes only | Default. Safe for public sharing |
| `write` | Search, read, AND create new notes | Let guests leave notes/summaries in your workspace |
| `edit` | Search, read, create, AND edit existing notes | Full collaboration — guests can modify content |

### Guest Tool Availability by Access Level

| Tool | read | write | edit |
|------|------|-------|------|
| `search_notes` | yes | yes | yes |
| `get_note_content` | yes | yes | yes |
| `list_folders` | yes | yes | yes |
| `list_notes` | yes | yes | yes |
| `create_note` | no | yes | yes |
| `edit_note` | no | no | yes |
| `save_snapshot` | no | no | yes |
| `list_snapshots` | yes | yes | yes |
| `restore_snapshot` | no | no | yes |

### Example: Write access for a collaborator

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/share/create" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "folders",
    "folderIds": [5, 12],
    "access": "read",
    "notesAccess": "write",
    "label": "Team collaborator"
  }' | jq .
```

Guests with this link can read all notes in the selected folders AND create new notes within those folders.

### Example: Full edit access with calendar

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/share/create" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "all",
    "access": "read_calendar_write",
    "notesAccess": "edit",
    "label": "Executive assistant"
  }' | jq .
```

---

## Managing Existing Links

### List all share links with analytics

```bash
curl -s -H "Authorization: Bearer $PULSE_API_KEY" \
  "https://api.pulse.systemind.com/v1/share/list" | jq .
```

Returns active and revoked links with: unique visitors, conversations, messages, and `notesAccess` level.

### Update link settings

```bash
curl -s -X PATCH "https://api.pulse.systemind.com/v1/share/{linkId}" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "access": "read_calendar",
    "notesAccess": "write",
    "expiresIn": "30d"
  }' | jq .
```

You can update `scope`, `access`, `notesAccess`, `label`, `expiresIn`, and `folderIds`.

### Revoke a link

```bash
curl -s -X DELETE "https://api.pulse.systemind.com/v1/share/{linkId}" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

Immediately cuts off all guest access.

---

## Scope Examples

**Share everything (read-only):**
```json
{"scope": "all", "access": "read"}
```

**Share specific folders:**
First list folders to get IDs:
```bash
curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_folders", "params": {}}' | jq .
```
Then create with folder IDs:
```json
{"scope": "folders", "folderIds": [5, 12], "access": "read"}
```

**Share with calendar booking:**
```json
{"scope": "all", "access": "read_calendar_write"}
```

**Share with write access (guests can create notes):**
```json
{"scope": "folders", "folderIds": [5], "notesAccess": "write", "label": "Collaborator"}
```

---

## Security Notes

- Each link has its own isolated sandbox
- The agent refuses questions outside its sandbox boundary
- All guest conversations are logged in analytics
- Revoked/expired links immediately cut off access
- Links with `expiresIn` are enforced server-side
- Short tokens (10 chars, base62) have ~59 bits of entropy — unguessable
- `notesAccess: "write"` only allows creating new notes, not modifying existing ones
- `notesAccess: "edit"` is the most permissive — use carefully

---

## Using the share_agent Tool

You can also create share links via the tools API (useful for agent-initiated sharing):

```bash
curl -s -X POST "https://api.pulse.systemind.com/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "share_agent",
    "params": {
      "scope": "folders",
      "folderIds": [5, 12],
      "access": "read_calendar",
      "notesAccess": "write",
      "label": "For team",
      "expiresIn": "7d"
    }
  }' | jq .
```

This is equivalent to `POST /share/create` but goes through the tools execution layer.
