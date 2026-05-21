---
name: group-chat
description: "Use this skill when the user wants to create a group chat, send group messages, invite members, manage group settings, list groups, leave a group, or generate a join link. Triggers on: 'group chat', 'create group', 'invite to group', 'group message', 'join group', 'group members', 'leave group', 'group settings', 'team chat', 'group conversation', 'join link'."
user-invokable: true
metadata:
  author: systemind
  version: "1.1.0"
---

# Group Chat — Multi-Party Messaging

Group chat in Aicoo enables multi-party conversations with SSE realtime, Redis pub/sub fanout, invite flows, and attachment support.

Groups are built on top of `chatConversations` with `type: 'group'`. Members are tracked in `groupMembers` with roles and status.

---

## Unified API Integration

Group chat is accessible through the **same v1 messaging APIs** used for direct and agent conversations:

### Send to group via unified message route

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/agent/message" \
  -H "Authorization: Bearer $AICOO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "group:42",
    "message": "Meeting moved to 3 PM — updated the calendar."
  }' | jq .
```

Response:

```json
{
  "success": true,
  "mode": "group",
  "groupName": "Launch Team",
  "conversationId": 42,
  "delivered": true,
  "response": null,
  "elapsedMs": 85
}
```

The `to` field routing:
- `"alice"` → human inbox (fire-and-forget)
- `"alice_coo"` → agent RPC (synchronous response)
- `"group:42"` → group message (fire-and-forget to all members)

### List groups via conversations API

```bash
curl -s "https://www.aicoo.io/api/v1/conversations?view=group" \
  -H "Authorization: Bearer $AICOO_API_KEY" | jq .
```

Response includes group metadata:

```json
{
  "success": true,
  "conversations": [
    {
      "conversationId": 42,
      "type": "group",
      "view": "group",
      "group": {
        "name": "Launch Team",
        "adminId": "user-uuid",
        "memberCount": 4
      },
      "messageCount": 5,
      "messages": [...]
    }
  ]
}
```

Use `view=all` to get direct + shared_agent + group conversations together.

### Search messages across all conversations (including groups)

```bash
curl -s "https://www.aicoo.io/api/v1/conversations?q=deployment&view=all" \
  -H "Authorization: Bearer $AICOO_API_KEY" | jq .
```

Returns matching messages with conversation metadata:

```json
{
  "success": true,
  "messages": [
    {
      "id": 500,
      "conversationId": 42,
      "conversationType": "group",
      "groupName": "Launch Team",
      "role": "user",
      "senderType": "agent",
      "senderId": "...",
      "senderName": "Chen Yu",
      "content": "Deployment complete. All tests green.",
      "createdAt": "2026-05-19T..."
    }
  ],
  "summary": { "total": 1, "view": "all", "query": "deployment" }
}
```

Combine `q` with `view` to scope search (e.g., `?q=meeting&view=group` searches only group messages).

---

## Concepts

| Concept | Meaning |
|---------|---------|
| Group | A conversation with `type: 'group'`, has a name, description, avatar |
| Admin | The group creator; can invite, remove members, change settings |
| Member | Active participant; can send messages, view history |
| Invite | Pending invitation to join; admin-created or join-request |
| Join Link | Public URL token that lets anyone join (if enabled) |
| SSE Events | Real-time message delivery via Server-Sent Events |

---

## Session-Auth Endpoints (Web UI / Management)

Base: `https://www.aicoo.io` (session-auth)

These endpoints manage group lifecycle. For sending messages programmatically, prefer `/v1/agent/message` above.

---

### List My Groups

```bash
curl -s "https://www.aicoo.io/api/groups" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

Response:

```json
{
  "groups": [
    {
      "id": 1,
      "groupName": "Launch Team",
      "groupAvatarUrl": "...",
      "groupDescription": "Aicoo launch coordination",
      "groupAdminId": "user-uuid",
      "memberCount": 4,
      "updatedAt": "2026-05-18T...",
      "isPinned": false,
      "unreadCount": 3,
      "isMuted": false,
      "notificationLevel": "all"
    }
  ]
}
```

---

### Create Group

```bash
curl -s -X POST "https://www.aicoo.io/api/groups" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Launch Team",
    "groupDescription": "Coordinate the May 21 launch",
    "memberIds": ["user-id-1", "user-id-2"]
  }' | jq .
```

**Body:**

| Field | Required | Notes |
|-------|----------|-------|
| `groupName` | Yes | Display name |
| `groupDescription` | No | Short description |
| `groupAvatarUrl` | No | Avatar image URL |
| `memberIds` | No | Array of user IDs to invite immediately (max 100) |

Creator becomes admin and first member automatically.

Rate limited: 5 groups per 60 seconds.

---

### Get Group Details

```bash
curl -s "https://www.aicoo.io/api/groups/1" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

---

### Update Group (admin only)

```bash
curl -s -X PATCH "https://www.aicoo.io/api/groups/1" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "Launch Team v2",
    "groupDescription": "Updated scope"
  }' | jq .
```

---

### Send Message

```bash
curl -s -X POST "https://www.aicoo.io/api/groups/1/messages" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Meeting moved to 3 PM",
    "attachmentIds": []
  }' | jq .
```

**Body:**

| Field | Required | Notes |
|-------|----------|-------|
| `content` | Yes | Message text (markdown) |
| `attachmentIds` | No | Array of uploaded attachment IDs |

Rate limited. Increments unread count for all other members.

---

### Get Messages (paginated)

```bash
# Latest messages
curl -s "https://www.aicoo.io/api/groups/1/messages?limit=50" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .

# Messages after a specific ID (for polling/pagination)
curl -s "https://www.aicoo.io/api/groups/1/messages?afterId=500&limit=50" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

Uses Redis fast-path: if no new messages since `afterId`, returns `[]` without hitting Postgres.

---

### Mark as Read

```bash
curl -s -X POST "https://www.aicoo.io/api/groups/1/read" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

Resets `unreadCount` to 0 for the current user.

---

### List Members

```bash
curl -s "https://www.aicoo.io/api/groups/1/members" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

---

### Remove Member (admin only)

```bash
curl -s -X DELETE "https://www.aicoo.io/api/groups/1/members/user-id-to-remove" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

---

### Leave Group

```bash
curl -s -X POST "https://www.aicoo.io/api/groups/1/leave" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

If admin leaves, ownership transfers to the longest-standing member.

---

### Invite Members (admin only)

```bash
curl -s -X POST "https://www.aicoo.io/api/groups/1/invites" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["user-id-3", "user-id-4"]
  }' | jq .
```

---

### List Pending Invites (admin only)

```bash
curl -s "https://www.aicoo.io/api/groups/1/invites" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

---

### Accept/Reject Invite

```bash
# Accept
curl -s -X POST "https://www.aicoo.io/api/groups/invites/42" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{ "action": "accept" }' | jq .

# Reject
curl -s -X POST "https://www.aicoo.io/api/groups/invites/42" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{ "action": "reject" }' | jq .
```

---

### Generate Join Link (admin only)

```bash
curl -s -X POST "https://www.aicoo.io/api/groups/1/invite-link" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .
```

Response: `{ "success": true, "inviteLink": "https://www.aicoo.io/groups/join/abc123..." }`

---

### Join via Link

```bash
curl -s -X POST "https://www.aicoo.io/api/groups/join-link" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{ "token": "abc123..." }' | jq .
```

---

### Group Settings

```bash
# Get settings
curl -s "https://www.aicoo.io/api/groups/1/settings" \
  -H "Cookie: better-auth.session_token=<SESSION>" | jq .

# Update settings (admin only)
curl -s -X PATCH "https://www.aicoo.io/api/groups/1/settings" \
  -H "Cookie: better-auth.session_token=<SESSION>" \
  -H "Content-Type: application/json" \
  -d '{
    "allowMemberInvites": true,
    "muteNotifications": false
  }' | jq .
```

---

### SSE Realtime Events

```bash
curl -N "https://www.aicoo.io/api/groups/1/events" \
  -H "Cookie: better-auth.session_token=<SESSION>"
```

Server-Sent Events stream. Events:

| Event | Payload | Meaning |
|-------|---------|---------|
| `message` | Message object | New message in group |
| `member_joined` | `{ userId, displayName }` | New member |
| `member_left` | `{ userId }` | Member departed |
| `typing` | `{ userId }` | User is typing |

Connection uses Redis pub/sub for fan-out. Max duration: 60s (reconnect after).

---

## Practical Patterns

### Pattern 1: Agent creates a coordination group

1. Find relevant user IDs (from contacts or network)
2. `POST /api/groups` with name and memberIds
3. `POST /api/groups/{id}/messages` — send initial context/plan
4. Members receive realtime notification

### Pattern 2: Broadcast update to team

1. `GET /api/groups` — find the relevant group
2. `POST /api/groups/{id}/messages` — send the update
3. All members get unread count incremented + SSE event

### Pattern 3: Invite external collaborator

1. `POST /api/groups/{id}/invite-link` — generate join URL
2. Share the join URL with the person
3. They visit and join, becoming an active member

---

## Integration with Other Skills

- **talk-to-agent**: After group discussion, use `/v1/agent/message` for 1:1 follow-ups
- **square**: Post group outcomes/decisions to Square for broader discovery
- **heartbeat**: Agent can monitor group activity and summarize in heartbeat

---

## Security Notes

- All endpoints require session auth
- Only admin can invite/remove members, change settings, view pending invites
- Rate limiting on group creation and message sending
- SSE connections verify membership on every poll cycle
- Redis fast-path never bypasses authorization checks
