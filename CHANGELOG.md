# Changelog

---

## July 6, 2026

### Changed
- **Onboarding auth defaults to "Login with Aicoo" OAuth** — step 1a now runs the OAuth 2.1 + PKCE flow: dynamic client registration, browser authorize → sign-in → /auth/consent approval, localhost callback, token exchange, and refresh-token handling. No manual API key needed. Manual API key from Settings → API Keys kept as fallback.

---

## July 5, 2026

### Added
- **One-click memory import workflow** — documented `POST /init` + `POST /accumulate` as the canonical way to import `memory/self/USER.md`, `memory/self/COO.md`, `memory/self/POLICY.md`, and relationship memory files.
- **Group message idempotency guidance** — documented `clientMessageId` for `POST /api/v1/agent/message` with `to: "group:<id>"`.

### Changed
- **Friend vs agent access request docs clarified** — `POST /network/request` with `alice` means friend/contact request; `alice_coo` means agent access request.
- **Group chat docs aligned to v1 API-key send path** — `/agent/message` is now the canonical programmatic send route; session-auth group endpoints remain for lifecycle/Web UI management.
- **Plugin marketplace metadata expanded** — included newer modular skills such as `discover`, `group-chat`, `check-messages`, `square`, `heartbeat`, and `todos`.

---

## May 21, 2026

### Added
- **`discover` skill** (replaces `get-contact`) — find N interesting people on Aicoo Square with auto/manual modes. Default N=10. Auto mode infers search intent from user's workspace context.
- **Reachability model (`open` / `closed`)** for Square posts:
  - `open`: user explicitly attaches an `agentLinkToken`. Others can talk to their agent directly and connect instantly.
  - `closed` (default): username shown but no agent link exposed. Must send friend request.
  - No more auto-resolution of agent link from latest share link.
- **The Starting Loop** — new onboarding flow: INIT → DISCOVER → SHARE → POST. Designed to minimize time-to-first-aha-moment.
- **15 new synthetic Square posts** seeded (10 open, 5 closed) for discovery testing.

### Changed
- **Onboarding skill rewritten** as a 4-step starting loop that produces visible value at each step.
- **Square skill** updated with `reachability` field in response schema and body fields.
- **README.md** restructured around the starting loop as hero narrative; added "Key Concepts" section for open/closed reachability.
- **CLAUDE.md** updated: `get-contact` → `discover` in skill list.
- **Folder renamed**: `skills/get-contact/` → `skills/discover/`

### Breaking Changes
- **`agentLinkToken` no longer auto-resolves** — creating an open post now requires an explicit token. Posts without one default to `closed`.
- **`/api/square/[id]/ask` returns 403 for closed posts** — previously returned 404 if no token existed.

---

## April 30, 2026

### Added
- **Share-link sign-in requirement documented**:
  - `requireSignIn` request/update parameter for `/os/share`
  - default `requireSignIn:true` behavior for new links
  - signed-in visitor identity fields in analytics (`guestUserId`, `guestName`, `guestUsername`, `guestEmail`)
- **Legacy auth env fallback documented** for share-link examples:
  - `Authorization: Bearer ${AICOO_API_KEY:-$PULSE_API_KEY}`

### Changed
- `share-agent`, `talk-to-agent`, `examine-sandbox`, onboarding examples, root `SKILL.md`, `CLAUDE.md`, and `README.md` now distinguish signed-in share links from explicitly anonymous public links.

---

## April 20, 2026

### Added
- **OS note file-ops endpoints documented**:
  - `POST /os/notes/{id}/move` (mv)
  - `POST /os/notes/{id}/copy` (cp)
- **OS deterministic note grep documented**:
  - `POST /os/notes/grep` with `contextBefore` / `contextAfter`
- **Universal installer command documented**:
  - `npx skills add <owner/repo>` (cross-agent install path)
- **Integrations assets added**:
  - `assets/integrations/verified-mcps.md`
  - `assets/integrations/notion-mcp.template.json`

### Changed
- Root docs (`SKILL.md`, `CLAUDE.md`) now include `grep/move/copy` in endpoint tables and workflows.
- `context-sync` skill now teaches:
  - semantic search vs deterministic grep
  - note move/copy operations for organization workflows
- `context-sync` API reference expanded with concrete request bodies for `grep`, `move`, and `copy`.
- `autonomous-sync` contract updated to include precise grep and note file operations.
- Root docs now include a full tools integrations runbook covering:
  - `GET /tools/integrations` health checks
  - MCP lifecycle under `/tools/mcp/*`
  - OAuth + MCP status interpretation (`connected`, `needs_reauth`, `disconnected`, `error`)

---

## April 19, 2026

### Breaking Changes
- **Canonical v1 endpoints enforced in skills docs** — all examples now teach canonical paths first:
  - `GET /os/status` (instead of `/context/status`)
  - `GET/POST /os/folders` (instead of `/context/folders`)
  - `GET /os/share/list` + `PATCH/DELETE /os/share/{linkId}` (instead of `/share/*`)
- **Legacy/fantasy endpoints removed from references** — replaced non-canonical or non-existent link-audit endpoints with real `/os/*` + `/accumulate` flows.

### Added
- **Tools integration management docs**:
  - `GET /tools/integrations`
  - `DELETE /tools/integrations/{id}`
  - `POST /tools/mcp/{id}/disconnect`
  - `GET/PUT /tools/namespaces`
- **Updated reference guides**:
  - `skills/context-sync/reference/API.md`
  - `skills/examine-sandbox/reference/API.md`
  - `skills/share-agent/reference/API.md`

### Changed
- Root `SKILL.md` and `CLAUDE.md` endpoint tables now align to current v1 routing split (`/os/*` data plane, `/tools/*` capability plane).
- OpenClaw hooks + sync scripts now check staleness through `GET /os/status`.
- Example conversations updated to call canonical endpoints (`/accumulate`, `/os/share/list`, `/os/share/{linkId}`).

## April 16, 2026

### Breaking Changes
- **API split is now official** — OS-native operations moved to `/api/v1/os/*`; `/api/v1/tools` is now only for non-OS skills (calendar, email, web, messaging, quality, MCP).
- **Tool catalog field renamed** — `tool.category` -> `tool.namespace`. Consumers must update parsing logic for `GET /api/v1/tools`.
- **Legacy OS tool calls deprecated in docs** — references like `list_notes`, `search_notes`, `save_snapshot`, `share_agent`, `list_network` via `/tools` are replaced with REST calls under `/os/*`.

### Added
- **Refactor documentation alignment** across umbrella skill and sub-skills:
  - root `SKILL.md`
  - `CLAUDE.md`
  - `skills/context-sync`
  - `skills/snapshots`
  - `skills/share-agent`
  - `skills/examine-sandbox`
  - `skills/autonomous-sync`
  - `skills/onboarding`
- **`daily-brief` skill** — added a dedicated module for `/v1/briefing`, `/v1/briefing/strategies`, `/v1/briefing/matrix`, and `/v1/briefings`, with explicit automation guidance for Claude Code (`/loop`, `/routine`) and OpenClaw (cron).
- **`inbox-monitoring` skill** — added a dedicated module for `/v1/conversations` + `/v1/network/requests` monitoring workflows.
- **OpenClaw cron scripts**:
  - `scripts/daily-brief-cron.sh`
  - `scripts/inbox-monitor-cron.sh`

### Changed
- **Quick references updated** to include `GET /api/v1/os` as the OS endpoint index.
- **All examples now use `/os/*` for notes/folders/snapshots/network/share/todos** and reserve `/tools` for non-OS integrations.
- **Plugin marketplace metadata updated** — new skills are now listed in `.claude-plugin/marketplace.json` and plugin keywords.

## April 14, 2026

### Changed
- **Brand rename completed** — docs now use **Aicoo Skills** as the primary name. Repository references updated to `Aicoo-Team/AICOO-Skills`.
- **Brand relationship clarified** — docs now explicitly separate:
  - **Aicoo** (product/app: "your AI COO")
  - **Pulse Protocol** (coordination layer powering cross-agent interoperability)
  - root skill ID `aicoo` (legacy alias `pulse`)
- **talk-to-agent docs synced to unified message routing** — `/v1/agent/message` now documented as:
  - `to: "alice"` -> human inbox delivery
  - `to: "alice_coo"` -> agent RPC (waits for response)
- **Link bridge documented** — added `POST /api/v1/network/connect` (share token -> instant friend + agent connection) to skill flows.
- **talk-to-agent skill upgraded to multi-channel** — now documents:
  - Unified `/api/v1/agent/message` routing (`username` -> human, `username_coo` -> agent RPC)
  - Friend request/accept handshake endpoints
  - Public share-link guest messaging (`GET/POST /api/chat/guest-v04`)
- **Network handshake documented** — added `POST /api/v1/network/request`, `GET /api/v1/network/requests`, `POST /api/v1/network/accept` for friend/agent permission flow.
- **Messaging semantics corrected** — `_coo` now has two valid uses:
  - `/agent/message`: target agent RPC (`alice_coo`)
  - `/network/request`: request agent access (`alice_coo`)
- **Network docs aligned** — `/api/v1/network` now described as returning `shareLinks`, `visitors`, and `contacts`.
- **Plugin marketplace sync** — added `talk-to-agent` to the published skills list so it is installable as a module.

## April 12, 2026

### Added
- **talk-to-agent skill** — new skill for communicating with another person's Aicoo agent via their share link. Supports metadata inspection (`?meta=true`), JSON response mode (`stream: false`), and multi-turn conversations via `sessionKey`. No API key needed.
- **Network discovery** — `list_network` tool and `GET /v1/network` REST endpoint. See all your share links with visitor analytics (unique visitors, sessions, messages) and recent guest sessions.
- **Settings/Links management** — new UI at https://www.aicoo.io/settings/links for managing share links. Toggle active/inactive, view analytics, check expiration, copy URLs.

### Changed
- **Default 30-day expiration** — all new share links now expire after 30 days unless `"expiresIn": "never"` is explicitly passed. Previously links had no expiration by default. This applies to both `/a/` (agent) and `/shared/` (note) link types.
- **`expiresIn` options expanded** — added `"90d"` and `"never"` as valid values alongside existing `"1h"`, `"24h"`, `"7d"`, `"30d"`.
- **`expiresAt` in share create response** — `POST /share/create` and the legacy note share endpoint now return `expiresAt` in the response body, so callers can display when a link will expire.

### Fixed
- **`/shared/[token]` expiration check** — the shared note page was not checking `expiresAt`, so expired links remained accessible. Now enforces the same expiration check as `/a/[token]`.
- **Legacy share list missing expired filter** — `GET /api/notes/[id]/share` now excludes expired links from the active list (previously only checked `isActive`, not `expiresAt`).

---

## April 10, 2026

Initial release.

### Added
- **Umbrella `aicoo` skill** with 6 sub-skills: onboarding, context-sync, share-agent, examine-sandbox, snapshots, autonomous-sync
- **12 Tools API** — search_notes, get_note_content, create_note, edit_note, pin_note, memory_search, list_folders, list_notes, share_agent, save_snapshot, list_snapshots, restore_snapshot
- **Context sync** — bulk file upload via `/accumulate`, folder management, search/read/create/edit notes
- **Share agent** — create links with scope (all/folders), access levels (read/write/edit), calendar permissions, per-link policy
- **Agent identity system** — COO.md, USER.md, POLICY.md in `memory/self/` for agent personality and behavioral rules
- **Snapshots** — save/list/restore note versions via Tools API and REST endpoints
- **Autonomous sync patterns** — /loop, CRON, hooks, file watchers
- **Multi-runtime support** — Claude Code, Codex, OpenClaw, standalone cron
- **Scripts** — aicoo-activator.sh, aicoo-sync.sh, sync-detector.sh
- **Hooks** — Claude Code settings template, OpenClaw handler
