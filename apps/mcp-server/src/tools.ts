import { ManakoClient, type Monitor, type Incident, type StatusPage, type AuditLog } from "@manako/api-client";

// Action constants — single source of truth for schema, switch, error messages
const MONITOR_ACTIONS = ["list", "get", "create", "update", "delete", "check"] as const;
const INCIDENT_ACTIONS = ["list", "acknowledge", "create", "update", "resolve", "delete"] as const;
const STATUS_PAGE_ACTIONS = ["list"] as const;
const AUDIT_LOG_ACTIONS = ["list"] as const;
type MonitorAction = (typeof MONITOR_ACTIONS)[number];
type IncidentAction = (typeof INCIDENT_ACTIONS)[number];
type AuditLogAction = (typeof AUDIT_LOG_ACTIONS)[number];

const STATUS_EMOJI: Record<string, string> = {
  up: "🟢", down: "🔴", degraded: "🟡", unknown: "⚪", paused: "⏸",
};

function formatMonitorCompact(m: Monitor): string {
  const emoji = STATUS_EMOJI[m.status] || "⚪";
  const lastChecked = m.lastCheckedAt
    ? new Date(m.lastCheckedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
    : "never";
  return `${emoji} ${m.name} — ${m.type}, ${m.status}, last checked ${lastChecked}`;
}

function formatIncidentCompact(i: Incident): string {
  const emoji = i.status === "ongoing" ? "🔴" : i.status === "resolved" ? "✅" : "👀";
  const started = new Date(i.startedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  return `${emoji} [${i.status}] ${i.title || i.id.slice(0, 12)} — started ${started}${i.resolvedAt ? `, resolved ${new Date(i.resolvedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}` : ""}`;
}

function formatStatusPageCompact(sp: StatusPage): string {
  const visibility = sp.isPublic ? "public" : "private";
  return `${sp.title} — /${sp.slug} (${visibility})`;
}

function formatAuditLogCompact(log: AuditLog): string {
  const ts = new Date(log.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const user = log.userName || log.userId || "system";
  const resource = log.resourceType || "-";
  const ip = log.ipAddress || "-";
  return `${ts} | ${user} | ${log.action} | ${resource} | ${ip}`;
}

function text(t: string) {
  return { content: [{ type: "text" as const, text: t }] };
}

function error(msg: string) {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
}

export function createTools(client: ManakoClient) {
  return {
    monitors: {
      description: "Manage monitoring targets. Actions: list (show all), get (detail by ID), create (new monitor, supports all types), update (modify by ID), delete (remove by ID), check (trigger immediate check by ID). Use verbose=true for full data.",
      inputSchema: {
        type: "object" as const,
        required: ["action"] as const,
        properties: {
          action: { type: "string", enum: [...MONITOR_ACTIONS], description: "Operation" },
          id: { type: "string", description: "Monitor ID (get/update/delete/check)" },
          name: { type: "string", description: "Name (create)" },
          url: { type: "string", description: "URL (create)" },
          type: { type: "string", enum: ["http", "tcp", "ping", "heartbeat", "webchange", "ssl", "domain"], description: "Monitor type (create, default: http)" },
          config: { type: "object", description: "Type-specific config (create/update non-http types)" },
          intervalSeconds: { type: "integer", minimum: 60, maximum: 86400, default: 300, description: "Interval in seconds (create)" },
          isActive: { type: "boolean", description: "Enable/disable (update)" },
          verbose: { type: "boolean", default: false, description: "Full API response" },
        },
      },
      execute: async (args: {
        action: string;
        id?: string;
        name?: string;
        url?: string;
        type?: string;
        config?: Record<string, unknown>;
        intervalSeconds?: number;
        isActive?: boolean;
        verbose?: boolean;
      }) => {
        try {
          switch (args.action) {
            case "list": {
              const { monitors } = await client.listMonitors();
              if (args.verbose) {
                return text(JSON.stringify(monitors, null, 2));
              }
              if (monitors.length === 0) return text("No monitors configured.");
              const summary = monitors.map(formatMonitorCompact).join("\n");
              return text(`Monitors (${monitors.length}):\n${summary}`);
            }
            case "get": {
              if (!args.id) return error("id is required for get action");
              const { monitor } = await client.getMonitor(args.id);
              if (args.verbose) {
                return text(JSON.stringify(monitor, null, 2));
              }
              return text(`${formatMonitorCompact(monitor)}\nID: ${monitor.id}\nInterval: ${monitor.intervalSeconds}s`);
            }
            case "create": {
              if (!args.name) return error("name is required for create action");
              const monitorType = args.type || "http";
              let config: Record<string, unknown>;
              if (monitorType === "http") {
                if (!args.url && !args.config) return error("url or config is required for http create");
                config = (args.config as Record<string, unknown>) || { url: args.url, method: "GET", expectedStatus: 200, timeoutMs: 10000 };
              } else {
                if (!args.config) return error("config is required for non-http types");
                config = args.config as Record<string, unknown>;
              }
              const { monitor } = await client.createMonitor({
                type: monitorType,
                name: args.name,
                config,
                intervalSeconds: args.intervalSeconds ?? 300,
              });
              return text(`Created: ${formatMonitorCompact(monitor)}\nID: ${monitor.id}`);
            }
            case "update": {
              if (!args.id) return error("id is required for update action");
              const updateData: Record<string, unknown> = {};
              if (args.name !== undefined) updateData.name = args.name;
              if (args.url !== undefined) updateData.config = { url: args.url, method: "GET", expectedStatus: 200, timeoutMs: 10000 };
              if (args.config !== undefined) updateData.config = args.config;
              if (args.intervalSeconds !== undefined) updateData.intervalSeconds = args.intervalSeconds;
              if (args.isActive !== undefined) updateData.isActive = args.isActive;
              const { monitor } = await client.updateMonitor(args.id, updateData);
              return text(`Updated: ${formatMonitorCompact(monitor)}\nID: ${monitor.id}`);
            }
            case "delete": {
              if (!args.id) return error("id is required for delete action");
              await client.deleteMonitor(args.id);
              return text(`Monitor ${args.id} deleted.`);
            }
            case "check": {
              if (!args.id) return error("id is required for check action");
              const { result, monitor } = await client.triggerCheck(args.id);
              if (args.verbose) return text(JSON.stringify({ result, monitor }, null, 2));
              const status = result.status === "up" ? "🟢 up" : result.status === "down" ? "🔴 down" : `🟡 ${result.status}`;
              const time = result.responseTimeMs !== undefined ? ` (${result.responseTimeMs}ms)` : "";
              const err = result.errorMessage ? `\nError: ${result.errorMessage}` : "";
              return text(`Check result: ${status}${time}${err}\nMonitor: ${formatMonitorCompact(monitor)}`);
            }
            default:
              return error(`Unknown action: ${args.action}. Use: ${MONITOR_ACTIONS.join(", ")}`);
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(`${msg}\nUpgrade your plan: ${err.upgradeUrl}`);
          }
          return error(msg);
        }
      },
    },
    incidents: {
      description: "Manage incidents. Actions: list, acknowledge, create (manual), update, resolve, delete (manual only). Use verbose=true for full data.",
      inputSchema: {
        type: "object" as const,
        required: ["action"] as const,
        properties: {
          action: { type: "string", enum: [...INCIDENT_ACTIONS], description: "Operation" },
          id: { type: "string", description: "Incident ID (acknowledge/update/resolve/delete)" },
          status: { type: "string", enum: ["ongoing", "resolved", "acknowledged"], description: "Filter (list)" },
          title: { type: "string", description: "Incident title (create)" },
          cause: { type: "string", description: "Description or cause (create/update/resolve)" },
          verbose: { type: "boolean", default: false, description: "Full API response" },
        },
      },
      execute: async (args: {
        action: string;
        id?: string;
        status?: string;
        title?: string;
        cause?: string;
        verbose?: boolean;
      }) => {
        try {
          switch (args.action) {
            case "list": {
              const { incidents } = await client.listIncidents(args.status);
              if (args.verbose) {
                return text(JSON.stringify(incidents, null, 2));
              }
              if (incidents.length === 0) return text(args.status ? `No ${args.status} incidents.` : "No incidents.");
              const summary = incidents.map(formatIncidentCompact).join("\n");
              return text(`Incidents (${incidents.length}):\n${summary}`);
            }
            case "acknowledge": {
              if (!args.id) return error("id is required for acknowledge action");
              await client.acknowledgeIncident(args.id);
              return text(`Incident ${args.id} acknowledged.`);
            }
            case "create": {
              if (!args.title) return error("title is required for create action");
              const { incident } = await client.createIncident({ title: args.title, cause: args.cause });
              return text(`Created: ${formatIncidentCompact(incident)}\nID: ${incident.id}`);
            }
            case "update": {
              if (!args.id) return error("id is required for update action");
              if (!args.title && !args.cause) return error("title or cause is required for update action");
              const data: { title?: string; cause?: string } = {};
              if (args.title) data.title = args.title;
              if (args.cause) data.cause = args.cause;
              const { incident: updated } = await client.updateIncident(args.id, data);
              return text(`Updated: ${formatIncidentCompact(updated)}`);
            }
            case "resolve": {
              if (!args.id) return error("id is required for resolve action");
              const { incident: resolved } = await client.resolveIncident(args.id, args.cause ? { cause: args.cause } : undefined);
              return text(`Resolved: ${formatIncidentCompact(resolved)}`);
            }
            case "delete": {
              if (!args.id) return error("id is required for delete action");
              await client.deleteIncident(args.id);
              return text(`Incident ${args.id} deleted.`);
            }
            default:
              return error(`Unknown action: ${args.action}. Use: ${INCIDENT_ACTIONS.join(", ")}`);
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(`${msg}\nUpgrade your plan: ${err.upgradeUrl}`);
          }
          return error(msg);
        }
      },
    },
    "status-pages": {
      description: "View status pages. Actions: list (show all status pages). Use verbose=true for full data.",
      inputSchema: {
        type: "object" as const,
        required: ["action"] as const,
        properties: {
          action: { type: "string", enum: [...STATUS_PAGE_ACTIONS], description: "Operation" },
          verbose: { type: "boolean", default: false, description: "Full API response" },
        },
      },
      execute: async (args: { action: string; verbose?: boolean }) => {
        try {
          switch (args.action) {
            case "list": {
              const { statusPages } = await client.listStatusPages();
              if (args.verbose) return text(JSON.stringify(statusPages, null, 2));
              if (statusPages.length === 0) return text("No status pages configured.");
              const summary = statusPages.map(formatStatusPageCompact).join("\n");
              return text(`Status Pages (${statusPages.length}):\n${summary}`);
            }
            default:
              return error(`Unknown action: ${args.action}. Use: ${STATUS_PAGE_ACTIONS.join(", ")}`);
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(`${msg}\nUpgrade your plan: ${err.upgradeUrl}`);
          }
          return error(msg);
        }
      },
    },
    "audit-logs": {
      description: "View audit logs. Actions: list (show audit trail with optional filters). Use verbose=true for full data.",
      inputSchema: {
        type: "object" as const,
        required: ["action"] as const,
        properties: {
          action: { type: "string", enum: [...AUDIT_LOG_ACTIONS], description: "Operation" },
          actionFilter: { type: "string", description: "Filter by action name (list)" },
          resourceType: { type: "string", description: "Filter by resource type (list)" },
          userId: { type: "string", description: "Filter by user ID (list)" },
          from: { type: "string", description: "Start datetime ISO 8601 (list)" },
          to: { type: "string", description: "End datetime ISO 8601 (list)" },
          limit: { type: "integer", minimum: 1, maximum: 100, description: "Max entries to return (list, default: 50)" },
          verbose: { type: "boolean", default: false, description: "Full API response" },
        },
      },
      execute: async (args: {
        action: string;
        actionFilter?: string;
        resourceType?: string;
        userId?: string;
        from?: string;
        to?: string;
        limit?: number;
        verbose?: boolean;
      }) => {
        try {
          switch (args.action) {
            case "list": {
              const { auditLogs } = await client.listAuditLogs({
                action: args.actionFilter,
                resourceType: args.resourceType,
                userId: args.userId,
                from: args.from,
                to: args.to,
                limit: args.limit,
              });
              if (args.verbose) return text(JSON.stringify(auditLogs, null, 2));
              if (auditLogs.length === 0) return text("No audit logs found.");
              const summary = auditLogs.map(formatAuditLogCompact).join("\n");
              return text(`Audit Logs (${auditLogs.length} entries):\n\n${summary}`);
            }
            default:
              return error(`Unknown action: ${args.action}. Use: ${AUDIT_LOG_ACTIONS.join(", ")}`);
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(`${msg}\nUpgrade your plan: ${err.upgradeUrl}`);
          }
          return error(msg);
        }
      },
    },
  };
}
