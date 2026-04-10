# Context Sync API Reference

Base URL: `https://api.pulse-ai.world/v1`

All endpoints require `Authorization: Bearer <PULSE_API_KEY>` header.

---

## GET /context/status

Get current context status and usage.

**Response (200):**
```json
{
  "success": true,
  "contextCount": 42,
  "totalSizeBytes": 1048576,
  "folders": [
    { "id": "uuid", "name": "General", "fileCount": 27 },
    { "id": "uuid", "name": "Project Alpha", "fileCount": 15 }
  ],
  "lastSyncedAt": "ISO8601",
  "limits": {
    "maxFiles": 100,
    "maxFileSizeBytes": 5242880,
    "maxTotalSizeBytes": 52428800,
    "remaining": 58
  }
}
```

---

## POST /context/accumulate

Upload files or text context to Pulse.

**Request Body:**
```json
{
  "files": [
    {
      "name": "README.md",
      "content": "# My Project\n...",
      "folder": "General"
    }
  ],
  "texts": [
    {
      "title": "About My Company",
      "content": "We are building...",
      "folder": "General"
    }
  ]
}
```

At least one of `files` or `texts` must be provided.

**Response (200):**
```json
{
  "success": true,
  "uploaded": 12,
  "skipped": 3,
  "updated": 2,
  "errors": [],
  "skippedReasons": [
    { "name": "image.png", "reason": "unsupported_type" }
  ],
  "contextCount": 54,
  "folder": { "id": "uuid", "name": "General" }
}
```

**Behavior:**
- Files with the same name in the same folder are **updated** (not duplicated)
- Unsupported file types are skipped with a reason
- Max 50 files per request
- Each file max 5 MB

---

## GET /context/folders

List all context folders.

**Response (200):**
```json
{
  "success": true,
  "folders": [
    { "id": "uuid", "name": "General", "fileCount": 27, "createdAt": "ISO8601" },
    { "id": "uuid", "name": "Project Alpha", "fileCount": 15, "createdAt": "ISO8601" }
  ]
}
```

---

## POST /context/folders

Create a new folder.

**Request Body:**
```json
{
  "name": "Investor Materials"
}
```

**Response (201):**
```json
{
  "success": true,
  "folder": { "id": "uuid", "name": "Investor Materials", "fileCount": 0 }
}
```

---

## DELETE /context/{contextId}

Delete a specific context item.

**Response (200):**
```json
{
  "success": true,
  "message": "Context item deleted"
}
```

---

## GET /context/search

Search across all context.

**Query Params:**
- `q`: Search query (required)
- `folder`: Filter by folder name (optional)
- `limit`: 1-50 (default: 10)

**Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "name": "pitch-deck.md",
      "folder": "Investor Materials",
      "snippet": "...relevant excerpt with search terms highlighted...",
      "score": 0.95
    }
  ]
}
```
