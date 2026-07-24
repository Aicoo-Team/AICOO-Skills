---
name: connect-local-agent
description: "Use this skill when the user wants to make THIS machine's coding agent reachable for live agent-to-agent collaboration — start the Aicoo local-agent bridge so paired peers can send requests to their running Claude Code / Codex, with per-tool owner approval. Triggers on: 'connect my local agent', 'start the bridge', 'make my agent reachable', 'set up local agent', 'local agent collaboration', 'let others reach my agent', 'run the Aicoo bridge', 'connect this device', or after the in-app 'Set up your local agent' prompt. NOTE: this is the RECEIVING side (be reachable); to CONTACT someone else's agent use talk-to-agent."
---
# Connect Local Agent — start the collaboration bridge

You set up and start the **Aicoo local-agent bridge** on the user's machine. The bridge
registers this device with Aicoo and holds a live Claude Code / Codex session, so another
person's agent can send it a request and get an answer back — with **every tool call gated on
the owner's approval** (a message conveys intent, not authority).

This is the *reachable* side. The bridge is a **long-lived process** — it must keep running.

## Prerequisites

- `AICOO_API_KEY` environment variable set (`aicoo_sk_live_...`)
- **Claude Code CLI ≥ 2.1.211** (the bridge drives it as the local runtime)
- `git` + Node.js

```bash
echo "${AICOO_API_KEY:+API key set (${#AICOO_API_KEY} chars)}" || echo "NO AICOO_API_KEY"
claude --version   # need ≥ 2.1.211; install/upgrade: npm i -g @anthropic-ai/claude-code
```
If `AICOO_API_KEY` is missing, get one at https://www.aicoo.io/settings/api-keys (or run `onboarding`).

---

## Step 1: Get the bridge

```bash
if [ ! -d c2c_pull ]; then
  git clone https://github.com/Aicoo-Team/c2c_pull.git
fi
cd c2c_pull && git pull --ff-only 2>/dev/null; npm ci
```
> The bridge repo is currently private (internal / test use). Once the open-source
> `@aicoo/local-agent` ships, swap this for the public repo or `npx @aicoo/local-agent`.

If the clone fails with an auth error, the machine lacks access to the private repo — request
access, or point the skill at a local checkout the user already has.

---

## Step 2: Start the bridge (background, keep alive)

Server: **production** `https://www.aicoo.io`, or a preview the user names (e.g. `https://yourcoo.ai`)
via `CCD_SERVER_URL`.

```bash
SERVER="${CCD_SERVER_URL:-https://www.aicoo.io}"
SPOOL="me.spool"   # remember this file — the asker side needs it for its reply route

nohup env \
  CCD_AICOO=1 \
  CCD_SERVER_URL="$SERVER" \
  CCD_TOKEN="$AICOO_API_KEY" \
  npm run bridge -- --adapter claude-code --spool "$SPOOL" \
  > bridge.log 2>&1 &
echo "bridge starting (pid $!) against $SERVER — logging to bridge.log"
```

`CCD_AICOO=1` selects the Aicoo transport; `CCD_TOKEN` reuses the API key; the bridge registers
its endpoint, sets a default route, and heartbeats.

---

## Step 3: Confirm it registered

```bash
sleep 3
head -40 bridge.log
```
Success = a JSON block with an **`endpointId`** and a default route set, no auth/connection errors.
Report the `endpointId` and confirm it is heartbeating.

Common failures:
- `401 / unauthorized` → wrong/expired `AICOO_API_KEY`, or `CCD_SERVER_URL` points at a server
  where that account doesn't exist (e.g. a preview using a different database).
- connection refused / timeout → check `CCD_SERVER_URL` and network.
- `claude` not found → add `--claude-path "$(which claude)"` to the bridge command.

---

## Step 4: What's now possible

- The agent is **reachable**. In the Aicoo app, anyone the user has **paired with** (agent access
  granted) can hit **Collaborate** and send a request; the user gets an **Accept** popup, then
  per-tool **Allow/Deny** prompts.
- **Keep this process running.** If it dies when the session ends, run the same `nohup … npm run
  bridge …` line in a normal terminal, or set up a launch agent for persistence.
- **Current limitation:** tool execution on the receiving side isn't enabled yet — the agent
  answers in **text only** for now (it won't run commands or edit files on the owner's machine).

## Quick reference

| Step | What happens |
|------|-------------|
| Prereq | `AICOO_API_KEY` + Claude Code CLI present |
| 1 | Clone/update the bridge, `npm ci` |
| 2 | Start bridge in background with the API key + server URL |
| 3 | Confirm `endpointId` + heartbeat in `bridge.log` |
| 4 | Reachable — paired peers can send requests (owner-approved) |
