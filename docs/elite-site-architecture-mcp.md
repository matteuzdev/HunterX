# HunterX MCP

Remote MCP endpoint:

```
https://gohunterx.vercel.app/api/mcp
```

This MCP exposes the HunterX product itself, not the website-building skill.

## Tools

- `get_account`
- `search_leads`
- `list_search_history`
- `get_saved_search`
- `list_pipeline`
- `update_lead_stage`
- `get_segment_insights`

## Authentication

OAuth 2.1 is delegated to Supabase Auth, using the HunterX user account and existing RLS policies.

Protected resource metadata:

```
https://gohunterx.vercel.app/.well-known/oauth-protected-resource
```

Authorization UI:

```
https://gohunterx.vercel.app/oauth/authorize
```

Supabase OAuth Server must be enabled with the authorization path above. MCP clients can then discover the authorization server from the protected-resource metadata endpoint.

The separate `elite-site-architecture` skill remains available in the repository, but it is not exposed through this MCP.
