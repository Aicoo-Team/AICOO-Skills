---
name: share-agent
description: "Use this skill when the user wants to share their AI agent with someone, generate a shareable link, let others talk to their agent, configure write access for guests, or manage existing shared links. Triggers on: 'share link', 'agent link', 'share my agent', 'let them talk to my AI', 'write access', 'edit access', 'guest permissions', or wanting to create a link for investors, prospects, partners, or anyone else to interact with their AI assistant."
metadata:
  author: systemind
  version: "2.0.0"
---

# Share Agent

Create and manage secure, shareable links to a user's agent.

## Prerequisites

- `AICOO_API_KEY` must be set
- Base URL: `https://www.aicoo.io/api/v1`
- User should sync context first

## Core Workflow

### 1) Check context exists

```bash
curl -s -H "Authorization: Bearer $AICOO_API_KEY" \
  "https://www.aicoo.io/api/v1/os/status" | jq .
```

If `contextCount` is 0, run `context-sync` first.

### 2) Create a share link (OS endpoint)

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/os/share" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope":"all",
    "access":"read",
    "notesAccess":"read",
    "label":"For investors",
    "expiresIn":"7d"
  }' | jq .
```

### 3) Confirm to user

Always report:

1. URL to share
2. Scope and notes/calendar permissions
3. Expiration
4. Recipients do not need an account
5. Access is sandboxed

## Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `scope` | `all` \| `folders` | `folders` requires `folderIds` |
| `folderIds` | number[] | folder scope ids |
| `access` | `read` \| `read_calendar` \| `read_calendar_write` | calendar access |
| `notesAccess` | `read` \| `write` \| `edit` | notes permission |
| `label` | string | link label |
| `expiresIn` | `1h` \| `24h` \| `7d` \| `30d` \| `90d` \| `never` | expiration |

## Notes Access Matrix

| Operation | read | write | edit |
|-----------|------|-------|------|
| Search/read notes | yes | yes | yes |
| Create notes | no | yes | yes |
| Edit notes | no | no | yes |
| Snapshots | no | no | yes |

## Manage Existing Links

### List links + visitors + contacts

```bash
curl -s -H "Authorization: Bearer $AICOO_API_KEY" \
  "https://www.aicoo.io/api/v1/os/network" | jq .
```

### Update/revoke link (canonical OS endpoints)

```bash
# update
curl -s -X PATCH "https://www.aicoo.io/api/v1/os/share/{linkId}" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"notesAccess":"write","expiresIn":"30d"}' | jq .

# revoke
curl -s -X DELETE "https://www.aicoo.io/api/v1/os/share/{linkId}" \
  -H "Authorization: Bearer $AICOO_API_KEY" | jq .
```

### List links with analytics

```bash
curl -s -H "Authorization: Bearer $AICOO_API_KEY" \
  "https://www.aicoo.io/api/v1/os/share/list?status=active&limit=20" | jq .
```

## Folder-Scoped Share Example

```bash
# inspect folders first
curl -s -H "Authorization: Bearer $AICOO_API_KEY" \
  "https://www.aicoo.io/api/v1/os/folders" | jq .

# create folder-scoped link
curl -s -X POST "https://www.aicoo.io/api/v1/os/share" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scope":"folders","folderIds":[5,12],"access":"read","notesAccess":"write","label":"Team collaborator"}' | jq .
```

## Per-Link Policy Editing

Link notes are stored in `links/` folder. Edit policy by searching notes then patching note content:

```bash
# find link policy note
curl -s -X POST "https://www.aicoo.io/api/v1/os/notes/search" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query":"For-Investors"}' | jq .

# edit policy note content
curl -s -X PATCH "https://www.aicoo.io/api/v1/os/notes/123" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content":"...\n\n## Policy\n\nBe professional, concise, and do not disclose confidential numbers."}' | jq .
```

## Security Notes

- Every link runs inside isolated scope
- Revoked/expired links lose access immediately
- Default expiration is 30 days unless overridden
- Use `notesAccess: "edit"` carefully
