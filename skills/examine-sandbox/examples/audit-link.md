# Example: Audit a Share Link Before Sending

## Scenario
You created a share link for a potential partner and want to make sure nothing sensitive is exposed.

## Conversation

```
User: "Check what my partner link is sharing"

Agent: Let me check your share links.
[Calls GET /share/list]

You have 2 active links:
1. "For investors" — 5 visitors, read-only
2. "Partner - Acme Corp" — 0 visitors, read + calendar

I'll examine the "Partner - Acme Corp" link.
[Calls GET /share/{linkId}/examine]

Sandbox contents (18 files across 2 folders):
- General (12 files): company-overview.md, product-roadmap.md, team-bios.md, ...
- Technical Docs (6 files): api-reference.md, architecture.md, ...

Capabilities:
  ✅ Can read notes and search
  ✅ Can read your calendar availability
  ❌ Cannot book meetings
  ❌ Cannot access email
  ❌ Cannot access todos

Now let me run a sensitivity scan...
[Calls POST /share/{linkId}/scan]

⚠️  2 warnings found:

1. team-bios.md (General) — MEDIUM
   Contains personal email addresses and phone numbers
   → Suggestion: Remove personal contact info or exclude this file

2. product-roadmap.md (General) — LOW
   Contains unreleased feature timelines
   → Suggestion: Review if you want partners to see your roadmap

What would you like to do?
- Remove these files from the link
- Keep them as-is
- Edit the files first and re-sync
```

## What the agent did
1. Listed share links
2. Auto-selected the partner link based on context
3. Examined sandbox contents and capabilities
4. Ran sensitivity scan
5. Presented findings with clear severity levels and suggestions
6. Offered actionable next steps
