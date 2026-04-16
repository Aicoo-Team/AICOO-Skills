# Share Agent API Reference

Base URL: `https://www.aicoo.io/api/v1`

All endpoints require `Authorization: Bearer <PULSE_API_KEY>`.

---

## POST /os/share

Create a new shareable agent link.

**Request Body:**

```json
{
  "scope": "all" | "folders",
  "access": "read" | "read_calendar" | "read_calendar_write",
  "notesAccess": "read" | "write" | "edit",
  "label": "string (optional)",
  "expiresIn": "1h" | "24h" | "7d" | "30d" | "90d" | "never",
  "folderIds": [1, 2, 3]
}
```

**Response (201):**

```json
{
  "success": true,
  "shareLink": {
    "id": 123,
    "token": "xK9mPq2RvT",
    "url": "https://www.aicoo.io/a/xK9mPq2RvT",
    "scope": "all",
    "access": "read",
    "label": "For investors",
    "expiresAt": "ISO8601 or null",
    "createdAt": "ISO8601"
  }
}
```

---

## GET /os/network

List network state for current user.

Includes:

- `shareLinks`
- `visitors`
- `contacts`

---

## Legacy link-management endpoints (still available)

### GET /share/list

List all share links for the authenticated user.

### PATCH /share/{linkId}

Update link settings (`scope`, `folderIds`, `access`, `notesAccess`, `label`, `expiresIn`).

### DELETE /share/{linkId}

Revoke a share link.

---

## Notes

- This is part of the OS split: sharing and network are OS-native (`/os/*`).
- `/tools` is reserved for non-OS skills and integrations.
