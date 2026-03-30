import { ManakoClient, type Monitor, type Incident, type StatusPage } from "@manako/api-client";
import type { Translation } from "./i18n.js";
import { t } from "./i18n.js";

// Action constants — single source of truth for schema, switch, error messages
const MONITOR_ACTIONS = ["list", "get", "create", "update", "delete", "check", "maintenance", "baseline-reset"] as const;
const INCIDENT_ACTIONS = ["list", "acknowledge"] as const;
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

function formatAuditLogCompact(log: any): string {
  const time = new Date(log.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  return `[${time}] ${log.action} ${log.resourceType || ""}${log.resourceId ? ` (${log.resourceId})` : ""} by ${log.userEmail || log.userId || "system"}`;
}

function text(t: string) {
  return { content: [{ type: "text" as const, text: t }] };
}

function error(msg: string) {
  return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
}

export function createTools(client: ManakoClient, tr?: Translation) {
  // Lazy import: if no translation provided, use English as default
  // This avoids a circular dependency and keeps backward compatibility
  const tm = tr ?? {
    monitors: {
      description: "Manage monitoring targets. Actions: list (show all), get (detail by ID), create (new monitor, supports all types), update (modify by ID), delete (remove by ID). Use verbose=true for full data.",
      noMonitors: "No monitors configured.",
      title: "Monitors ({{count}}):",
      idRequired: "id is required for {{action}} action",
      nameRequired: "name is required for create action",
      urlOrConfigRequired: "url or config is required for http create",
      configRequired: "config is required for non-http types",
      created: "Created: {{summary}}\nID: {{id}}",
      updated: "Updated: {{summary}}\nID: {{id}}",
      deleted: "Monitor {{id}} deleted.",
      checkResult: "Check result: {{status}}",
      unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
      upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
      idRequiredForUpdate: "id is required for update action",
      maintenanceStarted: "Maintenance started: {{name}} ({{id}}) - until {{until}}",
      maintenanceEnded: "Maintenance ended: {{name}} ({{id}})",
      baselineReset: "Baseline reset: {{name}} ({{id}})",
    },
    incidents: {
      description: "Manage incidents. Actions: list, acknowledge, create (manual), update, resolve, delete (manual only). Use verbose=true for full data.",
      noIncidents: "No incidents.",
      noIncidentsWithStatus: "No {{status}} incidents.",
      title: "Incidents ({{count}}):",
      idRequiredForAck: "id is required for acknowledge action",
      acknowledged: "Incident {{id}} acknowledged.",
      titleRequired: "title is required for create action",
      created: "Created: {{summary}}\nID: {{id}}",
      titleOrCauseRequired: "title or cause is required for update action",
      updated: "Updated: {{summary}}",
      resolved: "Resolved: {{summary}}",
      deleted: "Incident {{id}} deleted.",
      unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
      idRequired: "id is required for {{action}} action",
      upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    },
    statusPages: {
      description: "View status pages. Actions: list (show all status pages). Use verbose=true for full data.",
      noPages: "No status pages configured.",
      title: "Status Pages ({{count}}):",
      unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
      upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    },
    auditLogs: {
      description: "View audit logs. Actions: list (show audit trail with optional filters). Use verbose=true for full data.",
      noLogs: "No audit logs found.",
      title: "Audit Logs ({{count}} entries):",
      unknownAction: "Unknown action: {{action}}. Use: {{actions}}",
      upgradePlan: "{{msg}}\nUpgrade your plan: {{url}}",
    },
  } as Translation;

  return {
    monitors: {
      description: tm.monitors.description,
      inputSchema: {
        type: "object" as const,
        required: ["action"] as const,
        properties: {
          action: { type: "string", enum: [...MONITOR_ACTIONS], description: "Operation" },
          id: { type: "string", description: "Monitor ID (get/update/delete)" },
          name: { type: "string", description: "Name (create)" },
          url: { type: "string", description: "URL (create)" },
          type: { type: "string", enum: ["http", "tcp", "ping", "heartbeat", "webchange", "ssl", "domain"], description: "Monitor type (create, default: http)" },
          config: { type: "object", description: "Type-specific config (create/update non-http types)" },
          intervalSeconds: { type: "integer", minimum: 300, maximum: 86400, default: 300, description: "Interval in seconds (create)" },
          isActive: { type: "boolean", description: "Enable/disable (update)" },
          durationSeconds: { type: "integer", minimum: 60, maximum: 3600, default: 600, description: "Maintenance duration in seconds (maintenance)" },
          end: { type: "boolean", description: "End maintenance (maintenance)" },
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
        durationSeconds?: number;
        end?: boolean;
        verbose?: boolean;
      }) => {
        try {
          switch (args.action) {
            case "list": {
              const { monitors } = await client.listMonitors();
              if (args.verbose) {
                return text(JSON.stringify(monitors, null, 2));
              }
              if (monitors.length === 0) return text(tm.monitors.noMonitors);
              const summary = monitors.map(formatMonitorCompact).join("\n");
              return text(`${t(tm.monitors.title, { count: monitors.length })}\n${summary}`);
            }
            case "get": {
              if (!args.id) return error(t(tm.monitors.idRequired, { action: "get" }));
              const { monitor } = await client.getMonitor(args.id);
              if (args.verbose) {
                return text(JSON.stringify(monitor, null, 2));
              }
              return text(`${formatMonitorCompact(monitor)}\nID: ${monitor.id}\nInterval: ${monitor.intervalSeconds}s`);
            }
            case "create": {
              if (!args.name) return error(tm.monitors.nameRequired);
              const monitorType = args.type || "http";
              let config: Record<string, unknown>;
              if (monitorType === "http") {
                if (!args.url && !args.config) return error(tm.monitors.urlOrConfigRequired);
                config = (args.config as Record<string, unknown>) || { url: args.url, method: "GET", expectedStatus: 200, timeoutMs: 10000 };
              } else {
                if (!args.config) return error(tm.monitors.configRequired);
                config = args.config as Record<string, unknown>;
              }
              const { monitor } = await client.createMonitor({
                type: monitorType,
                name: args.name,
                config,
                intervalSeconds: args.intervalSeconds ?? 300,
              });
              return text(t(tm.monitors.created, { summary: formatMonitorCompact(monitor), id: monitor.id }));
            }
            case "update": {
              if (!args.id) return error(t(tm.monitors.idRequired, { action: "update" }));
              const updateData: Record<string, unknown> = {};
              if (args.name !== undefined) updateData.name = args.name;
              if (args.url !== undefined) updateData.config = { url: args.url, method: "GET", expectedStatus: 200, timeoutMs: 10000 };
              if (args.config !== undefined) updateData.config = args.config;
              if (args.intervalSeconds !== undefined) updateData.intervalSeconds = args.intervalSeconds;
              if (args.isActive !== undefined) updateData.isActive = args.isActive;
              const { monitor } = await client.updateMonitor(args.id, updateData);
              return text(t(tm.monitors.updated, { summary: formatMonitorCompact(monitor), id: monitor.id }));
            }
            case "delete": {
              if (!args.id) return error(t(tm.monitors.idRequired, { action: "delete" }));
              await client.deleteMonitor(args.id);
              return text(t(tm.monitors.deleted, { id: args.id }));
            }
            case "check": {
              if (!args.id) return error(t(tm.monitors.idRequired, { action: "check" }));
              const { result, monitor } = await client.triggerCheck(args.id);
              if (args.verbose) return text(JSON.stringify({ result, monitor }, null, 2));
              const status = result.status === "up" ? "🟢 up" : result.status === "down" ? "🔴 down" : `🟡 ${result.status}`;
              const time = result.responseTimeMs !== undefined ? ` (${result.responseTimeMs}ms)` : "";
              const err = result.errorMessage ? `\nError: ${result.errorMessage}` : "";
              return text(`${t(tm.monitors.checkResult, { status })}${time}${err}\nMonitor: ${formatMonitorCompact(monitor)}`);
            }
            case "maintenance": {
              if (!args.id) return error(t(tm.monitors.idRequired, { action: "maintenance" }));
              if (args.end) {
                const { monitor } = await client.endMaintenance(args.id);
                return text(t(tm.monitors.maintenanceEnded, { name: monitor.name, id: monitor.id }));
              }
              const duration = args.durationSeconds ?? 600;
              const { monitor } = await client.startMaintenance(args.id, duration);
              return text(t(tm.monitors.maintenanceStarted, {
                name: monitor.name,
                id: monitor.id,
                until: monitor.maintenanceUntil ?? "",
              }));
            }
            case "baseline-reset": {
              if (!args.id) return error(t(tm.monitors.idRequired, { action: "baseline-reset" }));
              const { monitor } = await client.baselineReset(args.id);
              return text(t(tm.monitors.baselineReset, { name: monitor.name, id: monitor.id }));
            }
            default:
              return error(t(tm.monitors.unknownAction, { action: args.action, actions: MONITOR_ACTIONS.join(", ") }));
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(t(tm.monitors.upgradePlan, { msg, url: err.upgradeUrl }));
          }
          return error(msg);
        }
      },
    },
    incidents: {
      description: tm.incidents.description,
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
              if (incidents.length === 0) {
                return text(args.status ? t(tm.incidents.noIncidentsWithStatus, { status: args.status }) : tm.incidents.noIncidents);
              }
              const summary = incidents.map(formatIncidentCompact).join("\n");
              return text(`${t(tm.incidents.title, { count: incidents.length })}\n${summary}`);
            }
            case "acknowledge": {
              if (!args.id) return error(tm.incidents.idRequiredForAck);
              await client.acknowledgeIncident(args.id);
              return text(t(tm.incidents.acknowledged, { id: args.id }));
            }
            case "create": {
              if (!args.title) return error(tm.incidents.titleRequired);
              const { incident } = await client.createIncident({ title: args.title, cause: args.cause });
              return text(t(tm.incidents.created, { summary: formatIncidentCompact(incident), id: incident.id }));
            }
            case "update": {
              if (!args.id) return error(t(tm.incidents.idRequired, { action: "update" }));
              if (!args.title && !args.cause) return error(tm.incidents.titleOrCauseRequired);
              const data: { title?: string; cause?: string } = {};
              if (args.title) data.title = args.title;
              if (args.cause) data.cause = args.cause;
              const { incident: updated } = await client.updateIncident(args.id, data);
              return text(t(tm.incidents.updated, { summary: formatIncidentCompact(updated) }));
            }
            case "resolve": {
              if (!args.id) return error(t(tm.incidents.idRequired, { action: "resolve" }));
              const { incident: resolved } = await client.resolveIncident(args.id, args.cause ? { cause: args.cause } : undefined);
              return text(t(tm.incidents.resolved, { summary: formatIncidentCompact(resolved) }));
            }
            case "delete": {
              if (!args.id) return error(t(tm.incidents.idRequired, { action: "delete" }));
              await client.deleteIncident(args.id);
              return text(t(tm.incidents.deleted, { id: args.id }));
            }
            default:
              return error(t(tm.incidents.unknownAction, { action: args.action, actions: INCIDENT_ACTIONS.join(", ") }));
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(t(tm.incidents.upgradePlan, { msg, url: err.upgradeUrl }));
          }
          return error(msg);
        }
      },
    },
    "status-pages": {
      description: tm.statusPages.description,
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
              if (statusPages.length === 0) return text(tm.statusPages.noPages);
              const summary = statusPages.map(formatStatusPageCompact).join("\n");
              return text(`${t(tm.statusPages.title, { count: statusPages.length })}\n${summary}`);
            }
            default:
              return error(t(tm.statusPages.unknownAction, { action: args.action, actions: STATUS_PAGE_ACTIONS.join(", ") }));
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(t(tm.statusPages.upgradePlan, { msg, url: err.upgradeUrl }));
          }
          return error(msg);
        }
      },
    },
    "audit-logs": {
      description: tm.auditLogs.description,
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
              if (auditLogs.length === 0) return text(tm.auditLogs.noLogs);
              const summary = auditLogs.map(formatAuditLogCompact).join("\n");
              return text(`${t(tm.auditLogs.title, { count: auditLogs.length })}\n\n${summary}`);
            }
            default:
              return error(t(tm.auditLogs.unknownAction, { action: args.action, actions: AUDIT_LOG_ACTIONS.join(", ") }));
          }
        } catch (err: any) {
          const msg = err.message || String(err);
          if (err.upgradeUrl) {
            return error(t(tm.auditLogs.upgradePlan, { msg, url: err.upgradeUrl }));
          }
          return error(msg);
        }
      },
    },
  };
}
