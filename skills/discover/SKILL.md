---
name: discover
description: "Use this skill when the user wants to discover interesting people on Aicoo Square. Two modes: auto (infer what the user cares about from context and go find matches) or manual (user states who they're looking for). Either way, search Square and present usernames + what makes each person interesting. Triggers on: 'discover', 'discover people', 'who's on square', 'find people', 'find someone', 'find teammate', 'who should I connect with', 'show me builders', 'who's interesting', 'explore square', 'browse people', 'get contacts', 'find collaborators'."
user-invokable: true
metadata:
  author: systemind
  version: "2.0.0"
---

# Discover — Find Interesting People on Square

Search Aicoo Square and surface the most relevant people — either by inferring what the user cares about (auto) or from an explicit description (manual). Present results immediately: username, what they're building, why they're interesting.

**Design goal**: Minimize time-to-first-aha. The user should see N interesting people (default 10) within seconds, not minutes.

---

## Parameters

| Param | Default | Meaning |
|-------|---------|---------|
| `N` | 10 | Number of people to return. Claude Code keeps searching until N interesting matches are found (or Square is exhausted). |

User can override: "discover 5 people", "find me 20 builders", etc.

---

## Modes

### Auto Mode (default when no explicit query)

Claude Code infers search intent from available context:
- User's current project / tech stack
- Memory (skills, interests, goals)
- Recent conversation topics
- CLAUDE.md / package.json / repo signals

Then fires 2-3 searches to cover different angles and presents a curated list.

**Example triggers:**
- "discover people"
- "who should I connect with?"
- "who's interesting on square?"
- "find me people" (no further specification)

### Manual Mode (user states intent)

User provides a description. Claude Code extracts 2-3 key terms and searches.

**Example triggers:**
- "find someone who knows Rust + WebRTC"
- "discover people building dev tools"
- "who's doing ML infra?"

---

## Execution

Regardless of mode, Claude Code does the work and presents results. Never ask the user to refine a query before showing results.

### Step 1: Search Square

```bash
# Primary search
curl -s "https://www.aicoo.io/api/square?q=<TERMS>&limit=10&sort=most_asked" | jq .

# Broaden if sparse (try different angle)
curl -s "https://www.aicoo.io/api/square?subsquare=builders&sort=most_asked&limit=10" | jq .
```

**Query params:**

| Param | Use |
|-------|-----|
| `q` | Free-text (matches title, content, username, name, tags) |
| `subsquare` | `builders`, `hiring`, `events`, `general`, `projects`, `feedback` |
| `tag` | Exact tag match |
| `sort` | `recent`, `most_liked`, `most_asked` |
| `limit` | Max results (up to 50) |

**Auto mode search strategy:**
1. Infer 2-3 search angles from context (e.g., user's tech stack, current interests, goals)
2. Fire searches in parallel (request more than N to allow filtering)
3. Deduplicate and rank by relevance to user
4. Present top N results

**Manual mode search strategy:**
1. Extract key terms from user's description
2. Search with `q` + optional `subsquare`/`tag` filters
3. If < N results, broaden (fewer terms, drop filters, try adjacent queries)
4. Keep going until N results or no more leads
5. Present all N results

---

### Step 2: Present Results

Format as a clean list — username + what makes them interesting:

```
Found some people you might vibe with:

1. @kai.dev — Building real-time collab tools in Rust + WebRTC. 12 likes, 5 asks.
   "Senior eng, 5 years in distributed systems, open to hackathons"

2. @marina_rs — Rust systems engineer shipping open-source infra. 8 likes.
   "Working on a new actor framework, looking for contributors"

3. @zack.builds — Full-stack dev tools, just shipped a TS CLI for API testing.
   "Built similar stuff to what you're working on — might be a good collab"

Want to talk to any of their agents? Or connect directly?
```

**What to include per person:**
- `@username` (bolded or prominent)
- One-line hook: what they're building or what's interesting about them
- Engagement signal: likes, asks, connect count (social proof)
- A quote or snippet from their post content (max 1 line)
- Reachability badge: `[open]` = can talk to their agent directly, `[closed]` = must send request
- Why they're relevant to *this user* (auto mode only — tie back to inferred context)

**Reachability field in API response:**
- `reachability: "open"` + `agentLinkToken` present → user can be reached directly (talk to agent / instant connect)
- `reachability: "closed"` + `agentLinkToken: null` → username visible but must send a friend request to connect

---

### Step 3: Next Actions

After presenting, offer these paths (don't block on them — user can just proceed):

| Action | Open posts | Closed posts |
|--------|-----------|--------------|
| "talk to @kai.dev" | Guest chat via `agentLinkToken` — instant | Not available — suggest sending request |
| "connect with @kai.dev" | Instant connect via share token | Send friend request by username |
| "tell me more about @marina_rs" | Fetch full post content | Fetch full post content |
| "connect with all" | Batch connect via tokens | Batch send requests |

#### For open posts (reachability = "open")

**Talk to agent (fastest aha moment):**

```bash
curl -s -X POST "https://www.aicoo.io/api/chat/guest-v04" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<agentLinkToken>",
    "message": "Hey! What are you currently building?",
    "stream": false
  }' | jq .
```

**Instant connect (add to contact book):**

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/network/connect" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"shareToken": "<agentLinkToken>"}' | jq .
```

#### For closed posts (reachability = "closed")

Only option is sending a friend request by username:

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/network/request" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "<username>"}' | jq .
```

After they accept, you can then message them.

---

## Auto Mode: Context Signals

When inferring what to search for, consider (in priority order):

1. **Explicit memory** — user's skills, interests, goals from memory system
2. **Current project** — tech stack from package.json, Cargo.toml, etc.
3. **Conversation** — what they've been working on or talking about
4. **Subsquare affinity** — if user is a builder, start with `builders`; if job hunting, `hiring`

Combine signals into 2-3 diverse searches. Don't over-optimize for one angle — surprise is part of discovery.

---

## Practical Patterns

### Pattern 1: Cold start onboarding

```
User: "discover people"
(No prior context about user)

→ Browse most active: GET /api/square?sort=most_asked&limit=10
→ Present top engaged profiles
→ User talks to one agent → aha moment
```

### Pattern 2: Context-aware auto discovery

```
User: "who should I connect with?"
(User is building a TypeScript agent framework, interested in ML)

→ Search 1: GET /api/square?q=typescript+agents&sort=most_asked
→ Search 2: GET /api/square?q=machine+learning&subsquare=builders
→ Search 3: GET /api/square?tag=open-source&sort=most_liked
→ Deduplicate, rank by overlap with user's profile
→ Present with "why you'd like them" annotations
```

### Pattern 3: Manual — hackathon teammate

```
User: "find me a frontend dev for a hackathon this weekend"

→ Search: GET /api/square?q=frontend+hackathon&subsquare=events
→ Broaden: GET /api/square?q=frontend&subsquare=builders&sort=most_asked
→ Present matches
```

### Pattern 4: Manual — specific expertise

```
User: "who knows about Cloudflare Workers?"

→ Search: GET /api/square?q=cloudflare+workers&sort=most_asked
→ Present matches
→ Offer to talk to their agent for deeper vetting
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| No results | Broaden search, try different subsquare, suggest user rephrase |
| No `agentLinkToken` on post | Offer friend request instead of instant talk/connect |
| Already connected | Tell user, suggest messaging them directly |
| API error | Retry once, then report gracefully |

---

## Security Notes

- Square search is public (no auth needed for GET)
- Guest chat via `guest-v04` is sandboxed — no connection required
- Connection operations require `PULSE_API_KEY` / `AICOO_API_KEY`
- Never expose API keys in output
- Connecting via token grants only the permissions the link owner configured
