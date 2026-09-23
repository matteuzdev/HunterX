# Elite Site Architecture MCP

Remote MCP endpoint hosted with HunterX:

```
https://gohunterx.vercel.app/api/mcp
```

Transport: Streamable HTTP via `mcp-handler` 2.x.

## Tools

- `get_elite_site_skill`
- `prepare_site_brief`
- `audit_site_draft`
- `build_site_prompt`

All tools are read-only. The MCP does not modify repositories, deploy sites or store client data.

The canonical reusable skill also lives in:

- `HunterX/skills/elite-site-architecture/SKILL.md`
- `research-before-build/skills/elite-site-architecture/SKILL.md`

## ChatGPT

When custom MCP/app connections are available in the account/workspace, add the remote MCP URL in Developer Mode / custom app setup.
