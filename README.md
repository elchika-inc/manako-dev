# Manako Dev

[![Status](https://status.manako.dev/manako/badge.svg)](https://status.manako.dev/manako)

[Manako](https://manako.dev) developer tools - MCP Server, Claude Code Plugin, and API Client.

**[Website](https://manako.dev)** | **[Documentation](https://docs.manako.dev)** | **[Dashboard](https://app.manako.dev)** | **[Status](https://status.manako.dev)**

## Overview

| Component | Description |
|-----------|-------------|
| **MCP Server** | Model Context Protocol server for AI agents to manage monitors and incidents |
| **Claude Code Plugin** | Claude Code marketplace plugin for monitoring operations |
| **API Client** | TypeScript client library for the Manako Public API |

## Claude Code Plugin

### Install from Marketplace

```bash
/plugin marketplace add elchika-inc/manako-dev
/plugin install manako@manako-dev
```

### Setup

After installation, run in Claude Code:

1. **CLI auth (recommended):** `manako login --api-key mk_your_key`
2. **MCP auth:** Ask Claude "Manako にログインして"

### Available Skills

| Skill | Example | Description |
|-------|---------|-------------|
| **setup** | "manako をセットアップして" | CLI/MCP initial setup guide |
| **monitor-status** | "モニターの状態を確認して" | Check monitor status |
| **create-monitor** | "example.com を監視して" | Create monitors (7 types) |
| **list-incidents** | "インシデント一覧を見せて" | List and filter incidents |
| **acknowledge-incident** | "インシデントを確認済みにして" | Acknowledge incidents |

## MCP Server

The MCP Server is hosted at `https://mcp.manako.dev/mcp` and supports the Streamable HTTP transport (MCP protocol `2024-11-05`).

### Connect manually

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "manako": {
      "type": "http",
      "url": "https://mcp.manako.dev/mcp",
      "headers": {
        "Authorization": "Bearer mk_your_api_key"
      }
    }
  }
}
```

### Tools

- **monitors** - List, create, update, delete, and check monitors
- **incidents** - List, acknowledge, create, update, resolve, and delete incidents
- **status-pages** - List status pages
- **auth** - Login with email/password (creates session API key)

## API Client

```typescript
import { ManakoClient } from "@manako/api-client";

const client = new ManakoClient({
  apiUrl: "https://api.manako.dev",
  apiKey: "mk_your_api_key",
});

const { monitors } = await client.listMonitors();
```

## Self-Hosting

The MCP Server can be deployed to Cloudflare Workers:

```bash
cd apps/mcp-server
pnpm install
pnpm deploy
```

## Links

- [Manako Website](https://manako.dev) - Product landing page
- [Documentation](https://docs.manako.dev) - Guides, API reference, and setup instructions
- [API Reference](https://docs.manako.dev/api/) - Public API documentation (OpenAPI)
- [Dashboard](https://app.manako.dev) - Monitoring dashboard
- [Status Page](https://status.manako.dev) - Manako service status

## Contributing

Contributions are welcome! Please open a Pull Request on this repository.

## License

MIT
