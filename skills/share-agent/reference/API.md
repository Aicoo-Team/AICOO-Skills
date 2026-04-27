# Share Agent API Reference

Base URL: `https://www.aicoo.io/api/v1`

All endpoints require `Authorization: Bearer <AICOO_API_KEY>`.

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

---

## GET /os/share/list

List links with analytics and effective capabilities.

**Query Params:**
- `status`: `active` | `revoked` | `all`
- `limit`: 1..50

---

## PATCH /os/share/{linkId}

Update link settings (`scope`, `folderIds`, `access`, `notesAccess`, `label`, `expiresIn`, `identity`, `email`, `todos`, `tools`).

---

## DELETE /os/share/{linkId}

Revoke a share link.

---

## GET /os/network

High-level network state:
- `shareLinks`
- `visitors`
- `contacts`

---

## Notes

- Sharing/network are OS-native (`/os/*`).
- `/tools` is reserved for non-OS integrations/tools execution.
