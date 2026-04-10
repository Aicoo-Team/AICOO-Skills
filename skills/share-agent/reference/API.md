# Share Agent API Reference

Base URL: `https://api.pulse.systemind.com/v1`

All endpoints require `Authorization: Bearer <PULSE_API_KEY>` header.

---

## POST /share/create

Create a new shareable agent link. Returns a short 10-character token URL.

**Request Body:**
```json
{
  "scope": "all" | "folders",
  "access": "read" | "read_calendar" | "read_calendar_write",
  "notesAccess": "read" | "write" | "edit",
  "label": "string (optional, max 100 chars)",
  "expiresIn": "1h" | "24h" | "7d" | "30d" | null,
  "folderIds": [1, 2, 3]
}
```

**Required fields:** none (defaults: `scope: "all"`, `access: "read"`, `notesAccess: "read"`)

**Notes access levels:**
- `read` — guests can search and view notes
- `write` — guests can also create new notes
- `edit` — guests can also modify existing notes and manage snapshots

**Response (201):**
```json
{
  "success": true,
  "shareLink": {
    "id": "uuid",
    "token": "xK9mPq2RvT",
    "url": "https://pulse-ai.world/shared/xK9mPq2RvT",
    "agentUrl": "https://pulse-ai.world/a/xK9mPq2RvT",
    "scope": "all",
    "access": "read",
    "notesAccess": "read",
    "label": "For investors",
    "expiresAt": "ISO8601 or null",
    "createdAt": "ISO8601"
  }
}
```

---

## GET /share/list

List all share links for the authenticated user.

**Query Params:**
- `status`: `active` | `revoked` | `all` (default: `active`)
- `limit`: 1-50 (default: 20)

**Response (200):**
```json
{
  "success": true,
  "links": [
    {
      "id": "uuid",
      "url": "https://pulse-ai.world/shared/xK9mPq2RvT",
      "agentUrl": "https://pulse-ai.world/a/xK9mPq2RvT",
      "label": "string",
      "scope": "all",
      "access": "read",
      "notesAccess": "read",
      "isActive": true,
      "expiresAt": "ISO8601 or null",
      "createdAt": "ISO8601",
      "analytics": {
        "uniqueVisitors": 5,
        "totalConversations": 12,
        "totalMessages": 48
      }
    }
  ]
}
```

---

## PATCH /share/{linkId}

Update share link settings.

**Request Body (all fields optional):**
```json
{
  "scope": "folders",
  "access": "read_calendar",
  "notesAccess": "write",
  "label": "Updated label",
  "expiresIn": "30d",
  "folderIds": [1, 2]
}
```

**Response (200):** Updated link object.

---

## DELETE /share/{linkId}

Revoke a share link. Immediately cuts off all guest access.

**Response (200):**
```json
{
  "success": true,
  "message": "Share link revoked"
}
```

---

## POST /tools — share_agent

Create a share link via the tools execution layer:

```json
{
  "tool": "share_agent",
  "params": {
    "scope": "folders",
    "folderIds": [5, 12],
    "access": "read_calendar",
    "notesAccess": "write",
    "label": "For team",
    "expiresIn": "7d"
  }
}
```

Equivalent to `POST /share/create` but runs through the tools wrapper.
