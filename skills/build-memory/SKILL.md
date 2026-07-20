---
name: build-memory
description: "Use this skill when the user wants to build, refresh, or teach their Aicoo agent memory from their real context — files, repo, git history, docs, or Claude/agent memory. Triggers on: 'build my memory', 'build my agent memory', 'teach my agent about me', 'what should my agent know', 'update my memory', 'refresh memory', 'import my context', 'sync my knowledge', 'make my agent know me', 'ingest my repo'."
user-invokable: true
metadata:
  author: aicoo
  version: "1.0.0"
---

# Build Memory — Turn Local Context Into Agent Memory

Your agent's memory *is* notes under `/Memory`. `/Memory/Self/` holds the
identity files that shape how the agent thinks and what it knows:

- `USER.md` — who the owner is (role, stack, current work, expertise, goals)
- `COO.md` — the agent's voice and operating style
- `POLICY.md` — boundaries (what to share, what never to share)
- `MEMORY.md` — long-term facts, projects, preferences, learned patterns

Building memory = reading the user's real context, synthesizing it, and
writing these files. This is more powerful than a generic importer because you
(the agent) can read the actual repo, git history, and docs and reason about
what matters.

Requires being signed in — see the `onboarding` skill. Resolve the token first
with the pack's `scripts/aicoo-auth.sh` (auto-refreshes):
`export AICOO_API_KEY="$(bash /path/to/aicoo-skills/scripts/aicoo-auth.sh)"`.

---

## 1. Ask where to build from

Don't guess the source — ask, then use what they pick:

> "Where should I build your memory from? I can use:
> • **this folder / repo** (I'll read the code, docs, and git history)
> • **a different local folder** — tell me the path
> • **Notion or Google Docs** — I'll point you to the importer
> • **just tell me about yourself** — we skip files"

- **Local folder / repo / git** → you (the agent) read it directly (step 2).
- **Notion / Google Docs** → these connect through the web importer, which the
  skill can't call with an API token. Point the user to
  **https://www.aicoo.io/import-workspace** (Connect Notion / Google Drive →
  select docs → it extracts memory + generates USER.md/COO.md). Then come back
  and continue from step 4 to verify.
- **Just tell me** → ask 3–4 questions (role, what they build, stack, how they
  want the agent to behave) and synthesize from that.

## 2. Scan the chosen local source

Pull the strongest available signals; adapt to what exists (use the folder the
user named, or the current one):

```bash
cat README.md package.json pyproject.toml Cargo.toml 2>/dev/null | head -200
git log --oneline -30 2>/dev/null
git shortlog -sn 2>/dev/null | head
ls docs/ notes/ 2>/dev/null
cat CLAUDE.md AGENTS.md .claude/*.md 2>/dev/null | head -200
```

Read domain/architecture/decision docs. If signals are thin, ask the user 2–3
targeted questions (role, what they're building, how they want their agent to
behave) rather than writing empty files.

## 3. Synthesize

Draft the four identity files from what you found. Be concrete and specific —
real project names, real stack, real facts. `MEMORY.md` should be a running
list of durable facts/projects/preferences, not prose.

Structure `MEMORY.md` like:
```
# Long-term Memory
## Key facts
- <fact>
## Projects
- <project>: <one line>
## Preferences
- <how they like to work / how the agent should behave>
```

## 4. Write it to Aicoo

`accumulate` with `Memory/...` paths routes into the memory space. It
create-or-updates (with versioning), so this skill is safe to re-run to refresh
memory later:

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/accumulate" \
  -H "Authorization: Bearer $AICOO_API_KEY" -H "Content-Type: application/json" \
  -d '{
    "files": [
      {"path": "Memory/Self/USER.md",   "content": "..."},
      {"path": "Memory/Self/COO.md",    "content": "..."},
      {"path": "Memory/Self/POLICY.md", "content": "..."},
      {"path": "Memory/Self/MEMORY.md", "content": "..."}
    ]
  }' | jq '{created, updated, skipped, workspace}'
```

For a team knowledge base, write topical notes into their own folder instead of
`Memory/Self`, e.g. `{"path": "Knowledge Base/architecture.md", ...}` — then
the `onboarding` / `share-agent` skills can share that folder as a unit.

## 5. Verify (the aha)

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/os/memory/search" \
  -H "Authorization: Bearer $AICOO_API_KEY" -H "Content-Type: application/json" \
  -d '{"query": "what am I working on", "maxResults": 5}' | jq '.result.results[] | {title, snippet, path}'
```

Show the user that their agent can now recall what you just wrote. To make it
tangible, create a share link (`share-agent` skill) and talk to their own agent
as a guest — it answers from this memory.

---

## Refresh later

Re-running this skill overwrites the identity files with a fresh synthesis
(auto-versioned, so history is kept). For incremental updates that append
rather than replace, use the `context-sync` / `autonomous-sync` skills.

## Notes

- `accumulate` tags these as workspace context; they live at the correct
  `/Memory/Self` path and are readable via `os/memory/search` and `os/notes`.
- Snapshot before a big rewrite if you want a restore point:
  `POST /api/v1/os/snapshots/{noteId}` (see the `snapshots` skill).
- Never write secrets/keys into memory. Put sharing boundaries in `POLICY.md`.
