# Examine Sandbox API Reference

Base URL: `https://www.aicoo.io/api/v1`

All endpoints require `Authorization: Bearer <PULSE_API_KEY>` header.

---

## GET /os/network

Network overview for the current user.

Includes:
- `shareLinks`
- `visitors`
- `contacts`

Use this for a quick risk/audience summary.

---

## GET /os/share/list

List all share links (with analytics + capabilities).

**Query Params:**
- `status`: `active` | `revoked` | `all`
- `limit`: 1..50

Use this endpoint to pick a `linkId` for updates/revoke.

---

## PATCH /os/share/{linkId}

Update link scope/capabilities.

**Body examples:**
```json
{ "scope": "folders", "folderIds": [5, 12] }
```

```json
{ "notesAccess": "read", "access": "read" }
```

```json
{ "expiresIn": "7d" }
```

---

## DELETE /os/share/{linkId}

Revoke a share link immediately.

---

## POST /os/notes/search

Use term-based scans to detect sensitive content before sharing.

**Body examples:**
```json
{ "query": "revenue pricing confidential" }
```

```json
{ "query": "password api key token secret" }
```

```json
{ "query": "contract nda legal" }
```

---

## Recommended Audit Flow

1. `GET /os/share/list` -> enumerate active links and capabilities
2. `GET /os/network` -> inspect visitor activity
3. `POST /os/notes/search` -> run sensitive-term scans
4. `PATCH /os/share/{linkId}` -> downgrade scope/access when needed
5. `DELETE /os/share/{linkId}` -> revoke high-risk links
