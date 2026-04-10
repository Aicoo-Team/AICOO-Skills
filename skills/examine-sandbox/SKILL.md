---
name: examine-sandbox
description: "Use this skill when the user wants to check what data their shared agent can access, inspect what's being shared, review privacy, or see what guests will see. Triggers on: 'what can they see', 'check my link', 'audit my agent', 'review what I'm sharing', or 'what data is shared'."
metadata:
  author: systemind
  version: "1.0.0"
---

# Examine Sandbox

You help users inspect exactly what data and capabilities are included in their shared agent links.

## Prerequisites

- `PULSE_API_KEY` environment variable must be set
- Base URL: `https://www.aicoo.io/api/v1`

## Core Workflow

### Step 1: List all share links

```bash
curl -s -H "Authorization: Bearer $PULSE_API_KEY" \
  "https://www.aicoo.io/api/v1/share/list" | jq .
```

Shows all links with: scope, calendar access, notes access (`notesAccess`), analytics (visitors, conversations, messages), expiry.

### Step 2: Check what context exists

```bash
curl -s -H "Authorization: Bearer $PULSE_API_KEY" \
  "https://www.aicoo.io/api/v1/context/status" | jq .
```

Returns folder tree with file counts. Cross-reference with each link's scope:
- `scope: "all"` → guests see everything listed here
- `scope: "folders"` with `folderIds` → guests only see those specific folders

### Step 3: Search for sensitive content

Use the tools API to search for potentially sensitive content:

```bash
# Search for financial data
curl -s -X POST "https://www.aicoo.io/api/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_notes", "params": {"query": "revenue pricing confidential"}}' | jq .

# Search for personal info
curl -s -X POST "https://www.aicoo.io/api/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tool": "search_notes", "params": {"query": "password API key credentials"}}' | jq .
```

### Step 4: Present findings

Summarize for the user:
1. **Links**: How many, their scope and access levels
2. **What's shared**: Folder names and file counts per link scope
3. **Calendar access**: `read` (none), `read_calendar` (free/busy), `read_calendar_write` (full + booking)
4. **Notes access**: `read` (search/view only), `write` (can create notes), `edit` (can modify existing notes + snapshots)
5. **Analytics**: Who's been using each link
6. **Warnings**: Any sensitive content found in shared scope
7. **Write risk**: If `notesAccess` is `write` or `edit`, guests can create/modify content in your workspace

### Step 5: Take action

If the user wants to restrict access:

**Narrow scope to specific folders:**
```bash
curl -s -X PATCH "https://www.aicoo.io/api/v1/share/{linkId}" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scope": "folders", "folderIds": [5, 12]}' | jq .
```

**Downgrade notes access:**
```bash
curl -s -X PATCH "https://www.aicoo.io/api/v1/share/{linkId}" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"notesAccess": "read"}' | jq .
```

**Revoke a link entirely:**
```bash
curl -s -X DELETE "https://www.aicoo.io/api/v1/share/{linkId}" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

## What to Look For

| Category | Search terms | Risk |
|----------|-------------|------|
| Financial data | revenue, burn rate, pricing, salary | Medium |
| Personal info | email, phone, address, SSN | High |
| Credentials | API key, password, token, secret | Critical |
| Internal comms | internal, confidential, private | Medium |
| Legal docs | contract, NDA, agreement | High |
