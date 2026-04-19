# Example: Audit a Share Link Before Sending

## Scenario
You created a share link for a potential partner and want to make sure nothing sensitive is exposed.

## Conversation

```
User: "Check what my partner link is sharing"

Agent: Let me list your links first.
[Calls GET /os/share/list?status=active]

You have 2 active links:
1. "For investors" — 5 visitors, read-only
2. "Partner - Acme Corp" — 0 visitors, read + calendar

I'll inspect activity and capabilities for "Partner - Acme Corp".
[Calls GET /os/network]

Now I'll run a sensitivity scan over your notes by query.
[Calls POST /os/notes/search query="revenue pricing confidential"]
[Calls POST /os/notes/search query="password api key token secret"]

⚠️  2 warnings found:

1. team-bios.md (General) — MEDIUM
   Contains personal email addresses and phone numbers
   -> Suggestion: remove personal contact info or narrow shared scope

2. product-roadmap.md (General) — LOW
   Contains unreleased feature timelines
   -> Suggestion: share only selected folders

Recommended action:
1) PATCH /os/share/{linkId} scope -> folders
2) PATCH /os/share/{linkId} notesAccess -> read
3) DELETE /os/share/{linkId} if you want immediate revoke
```

## What the agent did
1. Listed active share links
2. Checked visitor/network signals
3. Ran targeted sensitivity queries against notes
4. Mapped findings to concrete link-level actions
5. Provided low-risk next steps
