# Example: First-Time Onboarding for a Startup Founder

## Conversation Flow

**User**: "I want to set up Pulse and share my agent with investors"

**Agent**:

### Step 1: Check for API key
```bash
echo "${PULSE_API_KEY:+Key is set}" || echo "No key found"
# Output: No key found
```

"You'll need an API key first. Go to https://www.aicoo.io/settings/api-keys and generate one."

### Step 2: User sets key
```bash
export PULSE_API_KEY=pulse_sk_live_abc123...
```

### Step 3: Initialize
```bash
curl -s -X POST "https://www.aicoo.io/api/v1/init" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

### Step 4: Explore and ask
"Tell me about your startup — what do you do, who's on the team, and what would investors want to know?"

User responds with company details.

### Step 5: Scan local files
```bash
# Found: pitch-deck.md, README.md, docs/architecture.md
find . -maxdepth 2 -name "*.md" | head -10
```

### Step 6: Build knowledge base
```bash
# Upload about-me
curl -s -X POST "https://www.aicoo.io/api/v1/tools" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "create_note",
    "params": {
      "title": "About Us - Acme Corp",
      "content": "# Acme Corp\n\nWe build AI-powered widgets...\n\n## Team\n- Jane (CEO)\n- Bob (CTO)\n\n## Traction\n- 10K users, $50K MRR",
      "folderName": "General"
    }
  }' | jq .

# Bulk sync docs
curl -s -X POST "https://www.aicoo.io/api/v1/accumulate" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {"path": "Public/pitch-deck.md", "content": "# Pitch Deck\n\n..."},
      {"path": "Technical/architecture.md", "content": "# Architecture\n\n..."}
    ]
  }' | jq .
```

### Step 7: Create investor share link
```bash
curl -s -X POST "https://www.aicoo.io/api/v1/share/create" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "folders",
    "folderIds": [1, 3],
    "access": "read",
    "label": "For investors",
    "expiresIn": "30d"
  }' | jq .
```

**Result**: `https://www.aicoo.io/a/xK9mPq2RvT`

"Here's your investor link! Anyone with this URL can talk to your agent about what you've shared. It expires in 30 days. Try it in an incognito window to see the guest experience."
