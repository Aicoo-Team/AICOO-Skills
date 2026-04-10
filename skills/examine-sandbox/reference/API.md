# Examine Sandbox API Reference

Base URL: `https://www.aicoo.io/api/v1`

All endpoints require `Authorization: Bearer <PULSE_API_KEY>` header.

---

## GET /share/{linkId}/examine

Deep inspection of a share link's sandbox contents and capabilities.

**Response (200):**
```json
{
  "success": true,
  "link": {
    "id": "uuid",
    "label": "For investors",
    "scope": "all",
    "access": "read",
    "isActive": true,
    "expiresAt": "ISO8601 or null"
  },
  "sandbox": {
    "contextItems": [
      {
        "id": "ctx-uuid",
        "name": "pitch-deck-notes.md",
        "folder": "Investor Materials",
        "sizeBytes": 4200,
        "type": "markdown",
        "lastUpdated": "ISO8601"
      }
    ],
    "totalItems": 42,
    "totalSizeBytes": 156000,
    "folders": ["Investor Materials", "General"],
    "capabilities": {
      "canReadNotes": true,
      "canSearchNotes": true,
      "canReadCalendar": false,
      "canBookMeetings": false,
      "canAccessEmail": false,
      "canAccessTodos": false
    }
  },
  "sensitivityScan": {
    "status": "clean" | "warnings" | "not_scanned",
    "warnings": [],
    "scannedAt": "ISO8601 or null"
  }
}
```

---

## POST /share/{linkId}/scan

Run an AI-powered sensitivity scan on the sandbox contents.

Checks for:
- Financial data (revenue, burn rate, pricing)
- Personal information (emails, phones, addresses)
- Credentials (API keys, passwords, tokens)
- Internal communications (private messages)
- Legal documents (contracts, NDAs)

**Response (200):**
```json
{
  "success": true,
  "sensitivityScan": {
    "status": "warnings",
    "warnings": [
      {
        "contextId": "ctx-uuid",
        "name": "internal-finances.md",
        "folder": "General",
        "issues": [
          {
            "type": "financial_data" | "personal_info" | "credentials" | "internal_comms" | "legal_docs",
            "description": "Contains revenue figures and burn rate",
            "severity": "low" | "medium" | "high" | "critical",
            "suggestion": "Consider moving to a restricted folder"
          }
        ]
      }
    ],
    "scannedAt": "ISO8601"
  }
}
```

---

## POST /share/{linkId}/exclude

Exclude specific context items from the link's accessible scope.

**Request Body:**
```json
{
  "contextIds": ["ctx-uuid-1", "ctx-uuid-2"]
}
```

**Response (200):**
```json
{
  "success": true,
  "excluded": 2,
  "remainingContextCount": 40
}
```

Items are not deleted — just excluded from this specific share link's sandbox. They remain available in other links and in the user's own context.
