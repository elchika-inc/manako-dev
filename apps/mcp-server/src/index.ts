import { Hono } from "hono";
const PRODUCT = { name: "Manako" } as const;
import { ManakoClient } from "@manako/api-client";
import { createTools } from "./tools.js";
import { detectLanguage, getTranslation, t } from "./i18n.js";
import type { Language, Translation } from "./i18n.js";
import type { Env } from "./env.js";

const MCP_PROTOCOL_VERSION = "2024-11-05";

const app = new Hono<{ Bindings: Env }>();

// --- Language detection helper ---

function getLang(req: { header: (name: string) => string | undefined }): Language {
  return detectLanguage(req.header("Accept-Language") ?? "");
}

// --- Legacy REST API (kept for backward compatibility) ---

app.get("/", (c) => {
  const lang = getLang(c.req);
  const tr = getTranslation(lang);
  const tools = createTools(new ManakoClient({ apiUrl: "", apiKey: "" }), tr);
  return c.json({
    name: PRODUCT.name,
    version: "0.1.0",
    description: tr.server.description,
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  });
});

app.post("/tools/:toolName", async (c) => {
  const lang = getLang(c.req);
  const tr = getTranslation(lang);

  const apiKey = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!apiKey?.startsWith("mk_")) {
    return c.json({ error: tr.auth.missingApiKey }, 401);
  }

  const client = new ManakoClient({
    apiUrl: c.env.API_URL,
    apiKey,
  });

  const toolName = c.req.param("toolName");
  let args: Record<string, unknown>;
  try {
    args = await c.req.json();
  } catch {
    return c.json({ error: tr.auth.invalidJson }, 400);
  }

  const tools = createTools(client, tr);
  const tool = tools[toolName as keyof typeof tools];

  if (!tool) {
    return c.json({ error: t(tr.auth.unknownTool, { name: toolName }) }, 404);
  }

  try {
    const result = await tool.execute(args as any);
    return c.json(result);
  } catch (err: any) {
    return c.json({
      content: [{ type: "text", text: `Error: ${err.message || String(err)}` }],
      isError: true,
    });
  }
});

// --- MCP Streamable HTTP Protocol (JSON-RPC 2.0) ---

const SESSION_TTL = 60 * 60 * 24; // 24 hours

function jsonrpcError(id: string | number | null, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

function jsonrpcResult(id: string | number | null, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}

function generateSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getToolList(tr: Translation) {
  const dummyClient = new ManakoClient({ apiUrl: "", apiKey: "" });
  const tools = createTools(dummyClient, tr);
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}

function getAuthTool(tr: Translation) {
  return {
    name: "auth",
    description: tr.auth.description,
    inputSchema: {
      type: "object" as const,
      required: ["email", "password"] as const,
      properties: {
        email: { type: "string", description: tr.auth.emailDesc },
        password: { type: "string", description: tr.auth.passwordDesc },
      },
    },
  };
}

async function resolveApiKey(c: { env: Env; req: { header: (name: string) => string | undefined } }, sessionId?: string): Promise<string | null> {
  // 1. Check Authorization header
  const headerKey = c.req.header("Authorization")?.replace("Bearer ", "");
  if (headerKey?.startsWith("mk_")) return headerKey;
  // 2. Check session KV
  if (sessionId && c.env.SESSION_KV) {
    const stored = await c.env.SESSION_KV.get(`session:${sessionId}`);
    if (stored) return stored;
  }
  return null;
}

async function handleAuth(env: Env, sessionId: string, params: any, tr: Translation): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
  const { email, password } = params?.arguments ?? {};
  if (!email || !password) {
    return { content: [{ type: "text", text: `Error: ${tr.auth.emailPasswordRequired}` }], isError: true };
  }

  // Step 1: Login -> JWT
  const loginRes = await fetch(`${env.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!loginRes.ok) {
    const err: any = await loginRes.json().catch(() => ({}));
    return { content: [{ type: "text", text: `Error: ${err?.error?.message || t(tr.auth.loginFailed, { status: loginRes.status })}` }], isError: true };
  }
  const { accessToken, user } = await loginRes.json() as { accessToken: string; user: { email: string } };

  // Step 2: Obtain sudo token (API key creation requires sudoGuard)
  const sudoRes = await fetch(`${env.API_URL}/dashboard/sudo/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  });
  if (!sudoRes.ok) {
    const err: any = await sudoRes.json().catch(() => ({}));
    return { content: [{ type: "text", text: `Error: ${err?.error?.message || t(tr.auth.loginFailed, { status: sudoRes.status })}` }], isError: true };
  }
  const { sudoToken } = await sudoRes.json() as { sudoToken: string };

  // Step 3: Create API key with sudo token
  const keyRes = await fetch(`${env.API_URL}/dashboard/api-keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken}`, "X-Sudo-Token": sudoToken },
    body: JSON.stringify({ name: "MCP Session", scopes: ["read", "write"] }),
  });
  if (!keyRes.ok) {
    const err: any = await keyRes.json().catch(() => ({}));
    return { content: [{ type: "text", text: `Error: ${err?.error?.message || t(tr.auth.keyCreationFailed, { status: keyRes.status })}` }], isError: true };
  }
  const { apiKey: keyData } = await keyRes.json() as { apiKey: { key: string } };

  // Step 4: Store in KV
  await env.SESSION_KV.put(`session:${sessionId}`, keyData.key, { expirationTtl: SESSION_TTL });

  return { content: [{ type: "text", text: t(tr.auth.authenticated, { email: user.email }) }] };
}

app.post("/mcp", async (c) => {
  const lang = getLang(c.req);
  const tr = getTranslation(lang);

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json(jsonrpcError(null, -32700, tr.auth.parseError), 400);
  }

  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== "2.0") {
    return c.json(jsonrpcError(id ?? null, -32600, tr.auth.invalidRequest), 400);
  }

  // Notifications (no id) — accept silently
  if (id === undefined) {
    return new Response(null, { status: 202 });
  }

  // Session management via Mcp-Session-Id header
  let sessionId = c.req.header("Mcp-Session-Id") || "";

  switch (method) {
    case "initialize": {
      sessionId = generateSessionId();
      const res = c.json(jsonrpcResult(id, {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: PRODUCT.name, version: "0.1.0" },
      }));
      res.headers.set("Mcp-Session-Id", sessionId);
      return res;
    }

    case "ping":
      return c.json(jsonrpcResult(id, {}));

    case "tools/list": {
      const allTools = [getAuthTool(tr), ...getToolList(tr)];
      return c.json(jsonrpcResult(id, { tools: allTools }));
    }

    case "tools/call": {
      const toolName = params?.name as string;
      if (!toolName) {
        return c.json(jsonrpcError(id, -32602, tr.auth.missingToolName));
      }

      // auth tool — no API key required
      if (toolName === "auth") {
        if (!sessionId) {
          return c.json(jsonrpcResult(id, { content: [{ type: "text", text: `Error: ${tr.auth.noSession}` }], isError: true }));
        }
        const result = await handleAuth(c.env, sessionId, params, tr);
        return c.json(jsonrpcResult(id, result));
      }

      // All other tools require API key (header or session)
      const apiKey = await resolveApiKey(c, sessionId);
      if (!apiKey) {
        return c.json(jsonrpcResult(id, {
          content: [{ type: "text", text: `Error: ${tr.auth.notAuthenticated}` }],
          isError: true,
        }));
      }

      const client = new ManakoClient({ apiUrl: c.env.API_URL, apiKey });
      const tools = createTools(client, tr);
      const tool = tools[toolName as keyof typeof tools];
      if (!tool) {
        return c.json(jsonrpcError(id, -32601, t(tr.auth.unknownTool, { name: toolName })));
      }
      try {
        const result = await tool.execute((params?.arguments ?? {}) as any);
        return c.json(jsonrpcResult(id, result));
      } catch (err: any) {
        return c.json(jsonrpcResult(id, {
          content: [{ type: "text", text: `Error: ${err.message || String(err)}` }],
          isError: true,
        }));
      }
    }

    default:
      return c.json(jsonrpcError(id, -32601, t(tr.auth.methodNotFound, { method })));
  }
});

export default app;
