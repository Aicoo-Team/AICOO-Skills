---
name: invite-team
description: "Use this skill when the user wants to invite teammates to Aicoo — generate a team invite link, or a copy-paste prompt that sets a teammate up automatically. Triggers on: 'invite my team', 'invite a teammate', 'add team members', 'invite someone to my team', 'team invite link', 'onboard my team', 'get my coworkers on Aicoo', 'generate an invite'."
---
# Invite Team — Two Ways To Bring People In

Offer **both** and let the user pick per person:

- **Copy-paste onboarding prompt** — best for technical teammates. A block they
  paste into their own Claude Code / Codex / agent runtime that installs the
  skills, signs them in, builds their memory, and connects them back. Works for
  anyone, needs no Team plan.
- **Invite link** — best for anyone with (or willing to make) an Aicoo account.
  Adds them to your Team plan's seats. Requires you to own/admin a Team plan and
  the `os.team:write` scope.

Requires being signed in (`onboarding` skill). Resolve the token with the
pack's `scripts/aicoo-auth.sh`:
`export AICOO_API_KEY="$(bash /path/to/aicoo-skills/scripts/aicoo-auth.sh)"`.

---

## A) Copy-paste onboarding prompt (always available)

Get the inviter's username, then hand the user a ready-to-share block.

```bash
curl -s "https://www.aicoo.io/api/v1/identity" \
  -H "Authorization: Bearer $AICOO_API_KEY" | jq -r '.identity.username // .profile.username'
```

Present exactly this (substitute `<username>`; if you also made an invite link
in section B, add it as an optional line):

~~~
Send this to your teammate — they paste it into their AI agent (Claude Code, Codex, …):

---
Set me up on Aicoo and connect me to my teammate.

1. Install the Aicoo skills:
   npx skills add Aicoo-Team/AICOO-Skills
   (or: git clone https://github.com/Aicoo-Team/AICOO-Skills.git ~/.claude/plugins/aicoo-skills)
2. Sign in with Aicoo:
   node ~/.claude/plugins/aicoo-skills/scripts/aicoo-login.mjs
3. Run the Aicoo onboarding skill to build my agent memory and share my agent.
4. Connect me to @<username> on Aicoo (accept their team invite if I have one).
---
~~~

The teammate's agent does the install → sign-in → onboarding → connect end to
end. Nothing else needed from you.

## B) Invite link (Team plan)

### B1. Check team status first

```bash
curl -s "https://www.aicoo.io/api/v1/os/team" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  | jq '{hasTeam, role, canInvite, seatsAvailable: .team.seatsAvailable, members: (.members|length), pendingInvites}'
```

Handle the outcome:
- `hasTeam:false` → not on a Team plan. Point to https://www.aicoo.io/settings/team
  to start one (from $30/seat, 3 seats min). Then use section A in the meantime.
- `canInvite:false` → they're a member, not owner/admin. Only owners/admins
  invite — use section A instead.
- `seatsAvailable:0` → all seats used. Add seats at https://www.aicoo.io/settings/team.

### B2. Create the invite

Reusable link (anyone can use it until seats fill) — omit `email`:

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/os/team/invite" \
  -H "Authorization: Bearer $AICOO_API_KEY" -H "Content-Type: application/json" \
  -d '{"role":"member"}' | jq '{inviteUrl, emailDelivered}'
```

Email a specific person (also emails them the link if transactional email is
configured; still returns `inviteUrl` for you to share directly):

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/os/team/invite" \
  -H "Authorization: Bearer $AICOO_API_KEY" -H "Content-Type: application/json" \
  -d '{"email":"teammate@company.com","role":"member"}' | jq '{inviteUrl, emailDelivered}'
```

`role` may be `member` or `admin`. Present the returned
`https://www.aicoo.io/team/invites/<token>` — the recipient accepts by opening
it while signed in to Aicoo.

### B3. Best experience — pair both

Send the invite **link** (joins your team) together with the section-A
**prompt** (sets up their own agent). Link alone only adds a seat; the prompt is
what actually gets their agent built and connected.

---

## Notes & errors

| Result | Meaning / action |
|--------|------------------|
| `403 insufficient_scope` | Login didn't grant `os.team:write` — re-run `aicoo-login.mjs` to re-consent |
| `404` / `hasTeam:false` | Not on a Team plan → /settings/team, or use the section-A prompt |
| `403` "owners and admins" | You're a member; use the section-A prompt |
| `409` seats in use | Add seats at /settings/team |
| `429` | Rate-limited (20 invites/min) — wait a moment |

- The invite link is reusable until seats fill; revoke pending invites at
  https://www.aicoo.io/settings/team.
- Teams are a billing/seat + entitlement grouping. To share *content* with the
  team (a knowledge base), use a folder-scoped share link — see the
  `share-agent` and `onboarding` skills.
