---
name: snapshots
description: "Use this skill when the user wants to save a version of a note, create a backup before editing, list previous versions, restore a note to an earlier state, or manage note history. Triggers on: 'save version', 'snapshot', 'backup note', 'restore', 'rollback', 'version history', 'undo changes', 'previous version'."
metadata:
  author: systemind
  version: "1.0.0"
---

# Snapshots — Note Versioning

Save, list, and restore note versions. Use snapshots before major edits, to track knowledge evolution, or to roll back mistakes.

## Prerequisites

- `PULSE_API_KEY` environment variable must be set
- Base URL: `https://api.pulse-ai.world/v1`

---

## When to Use Snapshots

| Scenario | Action |
|----------|--------|
| Before a major edit | Save snapshot first |
| After bulk sync/accumulate | Save snapshots of updated notes |
| User says "undo" or "revert" | List snapshots, then restore |
| Periodic backup | Save snapshots of important notes on a schedule |
| Before autonomous updates | Always snapshot before overwriting content |

---

## Tool API (via /tools endpoint)

### Save a Snapshot

```bash
curl -s -X POST "https://api.pulse-ai.world/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "save_snapshot",
    "params": {
      "noteId": 42,
      "label": "Before Q2 update"
    }
  }' | jq .
```

**Response:**
```json
{
  "success": true,
  "result": {
    "versionId": 7,
    "noteId": 42,
    "label": "Before Q2 update",
    "createdAt": "2026-04-10T..."
  }
}
```

### List Snapshots

```bash
curl -s -X POST "https://api.pulse-ai.world/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "list_snapshots",
    "params": {
      "noteId": 42,
      "limit": 10
    }
  }' | jq .
```

### Restore a Snapshot

```bash
curl -s -X POST "https://api.pulse-ai.world/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "restore_snapshot",
    "params": {
      "noteId": 42,
      "versionId": 7
    }
  }' | jq .
```

**Important:** Restore automatically backs up the current state before overwriting, so you never lose data.

---

## REST API (direct endpoints)

For programmatic access without the tools wrapper:

### Save

```bash
curl -s -X POST "https://api.pulse-ai.world/v1/notes/42/snapshots" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"label": "Before Q2 update"}' | jq .
```

### List

```bash
curl -s "https://api.pulse-ai.world/v1/notes/42/snapshots?limit=10" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

### Get a Single Snapshot (with full content)

```bash
curl -s "https://api.pulse-ai.world/v1/notes/42/snapshots/7" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

### Restore

```bash
curl -s -X POST "https://api.pulse-ai.world/v1/notes/42/snapshots/7/restore" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

---

## Best Practices

### Labeling Conventions

Use descriptive labels that explain WHY the snapshot was taken:

| Good Labels | Bad Labels |
|------------|-----------|
| `"Before Q2 metrics update"` | `"backup"` |
| `"Pre-meeting sync"` | `"v1"` |
| `"Stable version after review"` | `"test"` |
| `"Before autonomous sync 2026-04-10"` | `"snapshot"` |

### Snapshot Before Edit Pattern

When using `edit_note`, always snapshot first:

```bash
# 1. Save current state
curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "save_snapshot", "params": {"noteId": 42, "label": "Pre-edit backup"}}' | jq .

# 2. Now safe to edit
curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "edit_note", "params": {"id": 42, "content": "# Updated content..."}}' | jq .
```

### Autonomous Sync Pattern

When running scheduled updates, snapshot all notes that will be modified:

```bash
# 1. List notes in target folder
NOTES=$(curl -s -X POST "$PULSE_BASE/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_notes", "params": {"folderId": 5}}' | jq -r '.result.notes[].id')

# 2. Snapshot each
for id in $NOTES; do
  curl -s -X POST "$PULSE_BASE/tools" \
    -H "Authorization: Bearer $PULSE_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"tool\": \"save_snapshot\", \"params\": {\"noteId\": $id, \"label\": \"Pre-sync $(date +%Y-%m-%d)\"}}" | jq .status
done

# 3. Now safe to accumulate/update
```

---

## Guest Access

Snapshots are accessible to shared agent guests based on their `notesAccess` level:

| notesAccess | list_snapshots | save_snapshot | restore_snapshot |
|-------------|---------------|---------------|-----------------|
| `read` | yes | no | no |
| `write` | yes | no | no |
| `edit` | yes | yes | yes |

Guests with `edit` access can save and restore snapshots for notes within their sandbox scope.
