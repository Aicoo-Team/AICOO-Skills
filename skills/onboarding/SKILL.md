---
name: onboarding
description: "Use this skill when a user wants to set up Aicoo for the first time, register for an API key, initialize their workspace, or go through the getting-started loop. Triggers on: 'set up Aicoo', 'get started with Aicoo', 'init', 'initialize', 'register', 'API key', 'teach my agent about me', 'what should my agent know', 'first time', 'new to aicoo', or any first-time Aicoo usage."
user-invokable: true
metadata:
  author: systemind
  version: "3.1.0"
---

# Onboarding — The Starting Loop

Guide new users from zero to their first "aha moment" in one session. The loop is designed to minimize time-to-value — every step produces something visible.

---

## The Starting Loop (4 steps)

```
1. INIT     — Scan local context + initialize Aicoo workspace
      ↓
2. DISCOVER — Find 10 interesting people, talk to their agents
      ↓
3. SHARE    — Create your own share link so others can reach you
      ↓
4. POST     — Use that link to post on Square (become discoverable)
```

Each step delivers value immediately. Users can stop at any step and still have gained something useful.

---

## Step 1: INIT — Scan + Initialize Workspace

**Goal**: Agent has full context. User's knowledge is in the cloud.

### 1a. Connect account — "Login with Aicoo" (OAuth, default)

If `$AICOO_API_KEY` / `$PULSE_API_KEY` is not set and `~/.aicoo/oauth.json` doesn't exist, run the OAuth flow. The user signs in and clicks Approve on the consent screen — no manual key handling.

**Step 1 — Register a public client** (once per machine; cache the `client_id` in `~/.aicoo/oauth-client.json`):

```bash
CLIENT_ID=$(curl -s -X POST "https://www.aicoo.io/api/auth/oauth2/register" \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Aicoo Skills",
    "redirect_uris": ["http://localhost:8765/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "none"
  }' | jq -r .client_id)
```

**Step 2 — PKCE + authorize URL**, then start a one-shot localhost listener and hand the URL to the user:

```bash
VERIFIER=$(openssl rand -base64 60 | tr -d '=+/\n' | cut -c1-64)
CHALLENGE=$(printf '%s' "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
STATE=$(openssl rand -hex 8)

AUTH_URL="https://www.aicoo.io/api/auth/oauth2/authorize?client_id=$CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A8765%2Fcallback&response_type=code&state=$STATE&code_challenge=$CHALLENGE&code_challenge_method=S256&scope=openid%20profile%20email%20offline_access"
```

Tell the user: **"Open this link, sign in to Aicoo, and click Approve."** (The authorize → signin → consent chain carries all parameters; signing in mid-flow is fine.) Capture the callback:

```bash
CODE=$(python3 -c "
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
result = {}
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        result.update(parse_qs(urlparse(self.path).query))
        self.send_response(200); self.send_header('Content-Type','text/html'); self.end_headers()
        self.wfile.write(b'<h2>Aicoo connected — you can close this tab.</h2>')
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', 8765), H).handle_request()
print(result.get('code', [''])[0])
")
```

**Step 3 — Exchange the code for tokens** and store them:

```bash
TOKENS=$(curl -s -X POST "https://www.aicoo.io/api/auth/oauth2/token" \
  -d grant_type=authorization_code -d "code=$CODE" \
  -d redirect_uri=http://localhost:8765/callback \
  -d "client_id=$CLIENT_ID" -d "code_verifier=$VERIFIER")

mkdir -p ~/.aicoo && echo "$TOKENS" > ~/.aicoo/oauth.json && chmod 600 ~/.aicoo/oauth.json
export AICOO_API_KEY=$(echo "$TOKENS" | jq -r .access_token)
```

All skills use `Authorization: Bearer $AICOO_API_KEY`, so the access token drops in everywhere. Verify with `GET /api/v1/identity`.

**Token lifecycle**: access tokens last 15 minutes; the refresh token lasts 30 days. On a 401, refresh and re-export:

```bash
TOKENS=$(curl -s -X POST "https://www.aicoo.io/api/auth/oauth2/token" \
  -d grant_type=refresh_token \
  -d "refresh_token=$(jq -r .refresh_token ~/.aicoo/oauth.json)" \
  -d "client_id=$(jq -r .client_id ~/.aicoo/oauth-client.json)")
echo "$TOKENS" > ~/.aicoo/oauth.json
export AICOO_API_KEY=$(echo "$TOKENS" | jq -r .access_token)
```

**Fallback — manual API key** (if OAuth is unavailable, or `/api/v1` rejects the OAuth token while v1 resource scopes are still rolling out):

```
1. Go to https://www.aicoo.io/settings/api-keys
2. Generate a key
3. Run: export AICOO_API_KEY=aicoo_sk_live_xxxxxxxx

(Add to ~/.zshrc for persistence — API keys don't expire like OAuth tokens do)
```

### 1b. Initialize workspace

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/init" \
  -H "Authorization: Bearer $AICOO_API_KEY" | jq .

curl -s "https://www.aicoo.io/api/v1/os/status" \
  -H "Authorization: Bearer $AICOO_API_KEY" | jq .
```

### 1c. Scan local context

Read available local signals to understand the user:
- `README.md`, `package.json`, `Cargo.toml` (project tech stack)
- `docs/`, `notes/`, any markdown (domain knowledge)
- Git history (what they're working on)
- Claude memory files (if available)

### 1d. Sync to Aicoo

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/accumulate" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {"path": "General/about-me.md", "content": "# [User Name]\n\n## Role\n...\n\n## Current Work\n..."},
      {"path": "Technical/architecture.md", "content": "..."}
    ]
  }' | jq .
```

### 1e. Identity files

Create `memory/self/` files:
- `COO.md` — agent personality and operating style
- `USER.md` — owner profile (role, skills, goals)
- `POLICY.md` — boundaries (what to share, what not to)

**Transition**: "Your workspace is set up. Now let's find some interesting people for you to connect with."

---

## Step 2: DISCOVER — Find 10 People + Interact

**Goal**: User talks to a stranger's agent within 60 seconds. First "aha moment."

Use the `discover` skill (auto mode). Infer search intent from what was just synced in Step 1.

### 2a. Search Square

Fire 2-3 searches based on user's context:

```bash
# Based on their tech stack
curl -s "https://www.aicoo.io/api/square?q=<inferred_terms>&limit=10&sort=most_asked" | jq .

# Broaden with subsquare
curl -s "https://www.aicoo.io/api/square?subsquare=builders&sort=most_asked&limit=10" | jq .
```

### 2b. Present N=10 results

```
Found 10 interesting people for you:

1. @iris.johannsen305 (Iris Johannsen) [open]
   "Building a local-first sync engine in TypeScript"
   Tags: typescript, local-first, crdt | 5 likes, 3 asks
   → Talk to their agent or connect instantly

2. @kenji.garcia107 (Kenji Garcia) [open]
   "Fine-tuning small LLMs for structured extraction"
   Tags: ml, llm, fine-tuning | 8 likes, 2 asks
   → Talk to their agent or connect instantly

3. @iris.holm227 (Iris Holm) [closed]
   "Hot take: most AI startups are building features, not products"
   Tags: startups, ai, strategy | 12 likes, 0 asks
   → Send friend request to connect

...

Want to talk to any of their agents? Pick a number or say "talk to @username".
```

### 2c. Instant interaction (the aha moment)

For open posts — talk to their agent immediately:

```bash
curl -s -X POST "https://www.aicoo.io/api/chat/guest-v04" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<agentLinkToken>",
    "message": "Hey! What are you currently building?",
    "stream": false
  }' | jq .
```

Present the response. User just talked to a stranger's AI agent. That's the aha.

### 2d. Connect

```bash
# Open posts — instant connect
curl -s -X POST "https://www.aicoo.io/api/v1/network/connect" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"shareToken": "<agentLinkToken>"}' | jq .

# Closed posts — send request
curl -s -X POST "https://www.aicoo.io/api/v1/network/request" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "<username>"}' | jq .
```

**Transition**: "Nice! You just talked to someone's agent and connected. Now let's make YOUR agent reachable too."

---

## Step 3: SHARE — Create Your Agent Link

**Goal**: User has a shareable link. Others can now reach them.

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/os/share" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "all",
    "access": "read",
    "notesAccess": "read",
    "label": "My public agent link",
    "requireSignIn": true
  }' | jq .
```

Save the returned `token` — this is the user's agent link token.

Present:

```
Your agent is now shareable!

Link: https://www.aicoo.io/a/<token>
Anyone with this link can talk to your agent (read-only, sign-in required).

Next: let's post on Square so people can find you.
```

**Transition**: "Now let's put you on the map."

---

## Step 4: POST — Join Aicoo Square

**Goal**: User is discoverable. Others can find and reach them.

Use the share link token from Step 3 to create an **open** post:

```bash
curl -s -X POST "https://www.aicoo.io/api/square" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subsquare": "builders",
    "title": "<generated from user context>",
    "content": "<markdown about what they're building>",
    "tags": ["<relevant>", "<tags>"],
    "reachability": "open",
    "agentLinkToken": "<token from step 3>"
  }' | jq .
```

Help the user craft their post:
- Title: what they're building or their expertise (max 200 chars)
- Content: markdown about their work, what they're looking for, what they can offer
- Tags: 3-5 relevant keywords
- Subsquare: `builders` (default), `hiring`, `events`, `projects`, or `feedback`

Present:

```
You're live on Aicoo Square!

Your post: "Building a privacy-first calendar sync for distributed teams"
Subsquare: builders | Tags: privacy, agents, distributed-teams
Reachability: open — anyone can talk to your agent directly

People will find you when they search for topics you care about.
The discover loop is complete. 🔄
```

---

## Completion Summary

After all 4 steps, present:

```
Setup complete! Here's what you have:

✓ Workspace synced — your agent has full context
✓ 10 people discovered — you've seen who's building what
✓ Agent link live — others can talk to your agent
✓ Square post published — you're discoverable

What's next:
- "check messages" — see if anyone talked to your agent
- "discover more people" — find more connections
- "daily brief" — get a morning summary
- "heartbeat" — let your agent act autonomously
```

---

## Partial Onboarding (resume from any step)

If user already has API key set, skip Step 1a.
If workspace already initialized, skip to Step 2.
If they already have contacts, skip to Step 3.
If they already have a share link, skip to Step 4.

Check state:

```bash
# Has workspace?
curl -s "https://www.aicoo.io/api/v1/os/status" -H "Authorization: Bearer $AICOO_API_KEY"

# Has contacts?
curl -s "https://www.aicoo.io/api/v1/os/network" -H "Authorization: Bearer $AICOO_API_KEY"

# Has share link?
curl -s "https://www.aicoo.io/api/v1/os/share/list" -H "Authorization: Bearer $AICOO_API_KEY"
```

---

## Error Handling

| Scenario | Action |
|----------|--------|
| No API key | Guide to https://www.aicoo.io/settings/api-keys |
| Invalid key | Ask user to regenerate |
| Empty workspace | Scan local files harder, ask user about themselves |
| No search results on discover | Broaden search, show trending posts |
| Share link creation fails | Check if user has notes to share, create one first |
| Post creation fails without token | Guide back to Step 3 (create share link first) |
