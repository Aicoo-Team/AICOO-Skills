# Context Sync API Reference

Base URL: `https://www.aicoo.io/api/v1`

All endpoints require `Authorization: Bearer <AICOO_API_KEY>` header.

---

## GET /os/status

Workspace summary (files/folders/size/last sync).

**Response (200):**
```json
{
  "success": true,
  "contextCount": 42,
  "totalSizeBytes": 1048576,
  "folders": [
    { "id": 5, "name": "General", "fileCount": 27 }
  ],
  "lastSyncedAt": "ISO8601"
}
```

---

## GET /os/folders

List folders.

**Query Params:**
- `parentId` (optional)

---

## POST /os/folders

Create folder(s).

**Body (single segment):**
```json
{ "name": "Investor Materials", "parentId": 5 }
```

**Body (nested path):**
```json
{ "path": "Technical/Architecture" }
```

---

## GET /os/notes

List notes in a folder or root.

**Query Params:**
- `folderId` (optional)
- `folderName` (optional)
- `limit` (optional, max 200)

---

## GET /os/notes/{id}

Read full note content.

---

## POST /os/notes

Create note.

**Body:**
```json
{ "title": "Roadmap", "content": "# Q2 Plan", "folderId": 5 }
```

---

## PATCH /os/notes/{id}

Edit note.

**Body:**
```json
{ "title": "Roadmap (Updated)", "content": "# Updated" }
```

Notes are auto-snapshotted before edits.

---

## POST /os/notes/search

Semantic note search.

**Body:**
```json
{ "query": "pricing strategy" }
```

---

## POST /os/notes/grep

Deterministic grep-style search (literal/regex + line context).

**Body:**
```json
{
  "pattern": "titleKey|title_key",
  "mode": "regex",
  "caseSensitive": false,
  "contextBefore": 5,
  "contextAfter": 5,
  "folderId": 5
}
```

---

## POST /os/notes/{id}/move

Move a note to another folder.

**Body:**
```json
{ "folderId": 12 }
```

Or:
```json
{ "folderName": "Archive" }
```

---

## POST /os/notes/{id}/copy

Copy a note (content + metadata) to target folder/title.

**Body:**
```json
{ "folderName": "Archive", "title": "Copy of Roadmap" }
```

---

## GET/POST /os/snapshots/{noteId}

- `GET`: list snapshots
- `POST`: save snapshot

---

## POST /os/snapshots/{noteId}/restore

Restore a snapshot.

**Body:**
```json
{ "versionId": 123 }
```

---

## GET /os/snapshots/{noteId}/{versionId}

Get a specific snapshot payload (title/content).

---

## POST /accumulate

Bulk file sync (recommended for multi-file updates).

**Body:**
```json
{
  "files": [
    { "path": "Technical/architecture.md", "content": "# Architecture\n..." }
  ]
}
```

Also supports delete:
```json
{
  "delete": [
    { "path": "Technical/old-doc.md" }
  ]
}
```

---

## POST /os/memory/search

Search episodic memory.

**Body:**
```json
{ "query": "meeting decisions" }
```
