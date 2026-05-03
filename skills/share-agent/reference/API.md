# Share Agent API Reference

Base URL: `https://www.aicoo.io/api/v1`

All endpoints require `Authorization: Bearer <AICOO_API_KEY>`. Legacy `PULSE_API_KEY` is also accepted.

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
  "folderIds": [1, 2, 3],
  "requireSignIn": true
}
```

`requireSignIn` defaults to `true`. When true, `/a/<token>` and `/shared/<token>` require a signed-in Aicoo user. Headless callers such as Claude Code can satisfy the same requirement by passing `Authorization: Bearer <AICOO_API_KEY>` to `guest-v04`. Signed-in guest-session analytics can include `guestUserId`, `guestName`, `guestUsername`, and `guestEmail`. Set `requireSignIn:false` only when the user explicitly wants an anonymous public link.

---

## GET /os/share/list

List links with analytics, effective capabilities, and `requireSignIn`.

**Query Params:**
- `status`: `active` | `revoked` | `all`
- `limit`: 1..50

---

## PATCH /os/share/{linkId}

Update link settings (`scope`, `folderIds`, `access`, `notesAccess`, `label`, `expiresIn`, `requireSignIn`, `identity`, `email`, `todos`, `tools`).

**Body examples:**

```json
{ "requireSignIn": true }
```

```json
{ "requireSignIn": false }
```

---

## DELETE /os/share/{linkId}

Revoke a share link.

---

## GET /os/network

High-level network state:
- `shareLinks`
- `visitors` (signed-in visitors may include name, username, email, and user id)
- `contacts`

---

## Notes

- Sharing/network are OS-native (`/os/*`).
- `/tools` is reserved for non-OS integrations/tools execution.
