# Example: Share Agent with an Investor

## Scenario
You're a founder preparing for a fundraise. You want to share your AI agent with potential investors so they can learn about your company before the first meeting.

## Step-by-step

### 1. Sync your investor materials
```
> "Sync all my files in ./investor-materials to Aicoo"
```
The agent reads files from `./investor-materials/` and uploads them to a "Investor Materials" folder on Aicoo.

### 2. Create a share link
```
> "Create a share link for investors, read-only, expires in 7 days"
```
The agent calls `POST /api/v1/os/share` with:
```json
{
  "target": "agent",
  "scope": "folders",
  "folderIds": [123],
  "access": "read",
  "notesAccess": "read",
  "label": "For investors - Series A",
  "expiresIn": "7d",
  "requireSignIn": true
}
```

### 3. Get the link
The agent returns:
```
Your shareable agent link:
https://www.aicoo.io/a/a1b2c3d4...

Signed-in recipients with this link can talk to your agent about your investor materials.
- Scope: Investor Materials folder only
- Access: Read-only (no calendar, no email)
- Expires: April 9, 2026
- Sign-in required for recipients
```

Before returning the link, verify `shareLink.target` is `agent`, the URL uses
`/a/`, and `capabilities.notes.scope` is `specific_folders` with folder ID `123`.
Treat `isAgentLink` as derived compatibility output.

### 4. Share it
Send the link via email, WhatsApp, LinkedIn, or any messaging platform. Recipients open the link, sign in, and then chat with your AI agent. For anonymous public access, explicitly set `requireSignIn:false`.

### 5. Check how it's going
```
> "How many people have used my investor link?"
```
The agent calls the analytics endpoint and reports visitor count, conversation count, and top questions asked.
