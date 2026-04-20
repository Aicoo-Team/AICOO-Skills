# Verified MCP Integrations

This file contains MCP integrations that are validated against Aicoo's current tools control plane:

- `GET /api/v1/tools/integrations`
- `GET/POST /api/v1/tools/mcp`
- `POST /api/v1/tools/mcp/{id}/authorize`
- `POST /api/v1/tools/mcp/{id}/refresh`
- `POST /api/v1/tools/mcp/{id}/disconnect`

## 1) Notion MCP (official)

- Official guide: https://developers.notion.com/guides/mcp/mcp
- Provider type: OAuth-based MCP server
- Typical Aicoo status sequence: `disconnected` -> `needs_reauth` -> `connected`

### Add in Aicoo

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/tools/mcp" \
  -H "Authorization: Bearer $PULSE_API_KEY" \
  -H "Content-Type: application/json" \
  -d @assets/integrations/notion-mcp.template.json | jq .
```

### Start OAuth authorization

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/tools/mcp/{id}/authorize" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

Open the returned `authorizeUrl` in browser, complete consent, then run refresh.

### Refresh + discover tools

```bash
curl -s -X POST "https://www.aicoo.io/api/v1/tools/mcp/{id}/refresh" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

### Verify unified health

```bash
curl -s "https://www.aicoo.io/api/v1/tools/integrations" \
  -H "Authorization: Bearer $PULSE_API_KEY" | jq .
```

## Health status enum

`/tools/integrations` returns these statuses for both OAuth and MCP records:

- `connected`
- `needs_reauth`
- `disconnected`
- `error`

No access tokens or refresh tokens are returned by this endpoint.
