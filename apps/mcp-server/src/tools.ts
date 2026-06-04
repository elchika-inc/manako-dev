import {
  ManakoClient,
  type Monitor,
  type Incident,
  type Service,
  type WebhookSubscription,
  type MonitorType,
  type IncidentStatus,
} from "@manako/api-client";
import type { Translation } from "./i18n.js";
import { t } from "./i18n.js";

const MONITOR_ACTIONS = [
  "list",
  "get",
  "create",
  "update",
  "delete",
  "check",
  "maintenance",
  "baseline-reset",
  "stats-reset",
] as const;
const INCIDENT_ACTIONS = ["list", "acknowledge", "create", "update", "resolve", "delete"] as const;
const SERVICE_ACTIONS = ["list", "stats-reset"] as const;
const AUDIT_LOG_ACTIONS = ["list"] as const;
const NOTIFICATION_CHANNEL_ACTIONS = ["test"] as const;
const WEBHOOK_SUBSCRIPTION_ACTIONS = ["list", "create", "delete"] as const;

export const KNOWN_TOOL_NAMES = [
  "monitors",
  "incidents",
  "services",
  "audit-logs",
  "notification-channels",
  "webhook-subscriptions",
] as const;
export type KnownToolName = (typeof KNOWN_TOOL_NAMES)[number];

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

// --- Formatters ---

const STATUS_EMOJI: Record<string, string> = {
  up: "🟢",
  down: "🔴",
  degraded: "🟡",
  unknown: "⚪",
  paused: "⏸",
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

function formatServiceCompact(s: Service): string {
  const visibility = s.isPublic ? "public" : "private";
  let line = `${s.name} — /${s.slug} (${visibility})`;
  if (s.customDomain) line += ` | ${s.customDomain} [${s.customDomainStatus ?? "unknown"}]`;
  return line;
}

function formatAuditLogCompact(log: any): string {
  const time = new Date(log.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  return `[${time}] ${log.action} ${log.resourceType || ""}${log.resourceId ? ` (${log.resourceId})` : ""} by ${log.userEmail || log.userId || "system"}`;
}

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function err(msg: string): ToolResult {
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

// --- Static input schemas (module-level constants, computed once) ---

const MONITORS_INPUT_SCHEMA = {
  type: "object" as const,
  required: ["action"] as const,
  properties: {
    action: { type: "string", enum: [...MONITOR_ACTIONS], description: "Operation" },
    id: { type: "string", description: "Monitor ID (get/update/delete)" },
    name: { type: "string", description: "Name (create)" },
    url: { type: "string", description: "URL (create)" },
    type: {
      type: "string",
      enum: ["http", "tcp", "ping", "heartbeat", "webchange", "ssl", "domain"],
      description: "Monitor type (create, default: http)",
    },
    config: { type: "object", description: "Type-specific config (create/update non-http types)" },
    intervalSeconds: {
      type: "integer",
      minimum: 300,
      maximum: 86400,
      default: 300,
      description: "Interval in seconds (create)",
    },
    isActive: { type: "boolean", description: "Enable/disable (update)" },
    maintenanceUntil: { type: "string", description: "ISO 8601 end datetime for maintenance" },
    monitorIds: { type: "string", description: "Comma-separated monitor IDs for bulk maintenance" },
    all: { type: "boolean", description: "Apply to all active monitors" },
    notify: { type: "boolean", description: "Send notification to channels" },
    end: { type: "boolean", description: "End maintenance (maintenance)" },
    before: {
      type: "string",
      description: "Reset stats before this date (YYYY-MM-DD). Omit for all time.",
    },
    verbose: { type: "boolean", default: false, description: "Full API response" },
  },
};

const INCIDENTS_INPUT_SCHEMA = {
  type: "object" as const,
  required: ["action"] as const,
  properties: {
    action: { type: "string", enum: [...INCIDENT_ACTIONS], description: "Operation" },
    id: { type: "string", description: "Incident ID (acknowledge/update/resolve/delete)" },
    status: {
      type: "string",
      enum: ["ongoing", "resolved", "acknowledged"],
      description: "Filter (list)",
    },
    title: { type: "string", description: "Incident title (create)" },
    cause: { type: "string", description: "Description or cause (create/update/resolve)" },
    serviceId: {
      type: "string",
      description: "Service ID to associate the incident with (create only)",
    },
    verbose: { type: "boolean", default: false, description: "Full API response" },
  },
};

const SERVICES_INPUT_SCHEMA = {
  type: "object" as const,
  required: ["action"] as const,
  properties: {
    action: { type: "string", enum: [...SERVICE_ACTIONS], description: "Operation" },
    id: { type: "string", description: "Service ID (stats-reset)" },
    before: {
      type: "string",
      description: "Reset stats before this date (YYYY-MM-DD). Omit for all time.",
    },
    verbose: { type: "boolean", default: false, description: "Full API response" },
  },
};

const AUDIT_LOGS_INPUT_SCHEMA = {
  type: "object" as const,
  required: ["action"] as const,
  properties: {
    action: { type: "string", enum: [...AUDIT_LOG_ACTIONS], description: "Operation" },
    actionFilter: { type: "string", description: "Filter by action name (list)" },
    resourceType: { type: "string", description: "Filter by resource type (list)" },
    userId: { type: "string", description: "Filter by user ID (list)" },
    from: { type: "string", description: "Start datetime ISO 8601 (list)" },
    to: { type: "string", description: "End datetime ISO 8601 (list)" },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 100,
      description: "Max entries to return (list, default: 50)",
    },
    verbose: { type: "boolean", default: false, description: "Full API response" },
  },
};

const NOTIFICATION_CHANNELS_INPUT_SCHEMA = {
  type: "object" as const,
  required: ["action"] as const,
  properties: {
    action: { type: "string", enum: [...NOTIFICATION_CHANNEL_ACTIONS], description: "Operation" },
    id: { type: "string", description: "Notification channel ID" },
  },
};

const WEBHOOK_SUBSCRIPTIONS_INPUT_SCHEMA = {
  type: "object" as const,
  required: ["action"] as const,
  properties: {
    action: { type: "string", enum: [...WEBHOOK_SUBSCRIPTION_ACTIONS], description: "Operation" },
    id: { type: "string", description: "Subscription ID (delete)" },
    targetUrl: { type: "string", description: "HTTPS URL to receive webhooks (create)" },
    secret: { type: "string", description: "Signing secret, min 16 chars (create)" },
    events: {
      type: "array",
      items: { type: "string" },
      description: "Event types: incident.created, incident.resolved, webchange.detected (create)",
    },
    description: { type: "string", description: "Optional description (create)" },
    verbose: { type: "boolean", default: false, description: "Full API response" },
  },
};

// --- Static tool list: description + schema only, no client needed ---

export function getToolSchemas(
  tr: Translation,
): Array<{ name: string; description: string; inputSchema: object }> {
  return [
    { name: "monitors", description: tr.monitors.description, inputSchema: MONITORS_INPUT_SCHEMA },
    {
      name: "incidents",
      description: tr.incidents.description,
      inputSchema: INCIDENTS_INPUT_SCHEMA,
    },
    { name: "services", description: tr.services.description, inputSchema: SERVICES_INPUT_SCHEMA },
    {
      name: "audit-logs",
      description: tr.auditLogs.description,
      inputSchema: AUDIT_LOGS_INPUT_SCHEMA,
    },
    {
      name: "notification-channels",
      description: tr.notificationChannels.description,
      inputSchema: NOTIFICATION_CHANNELS_INPUT_SCHEMA,
    },
    {
      name: "webhook-subscriptions",
      description: tr.webhookSubscriptions.description,
      inputSchema: WEBHOOK_SUBSCRIPTIONS_INPUT_SCHEMA,
    },
  ];
}

// --- Per-tool execute functions ---

async function executeMonitors(
  args: Record<string, unknown>,
  client: ManakoClient,
  tm: Translation,
): Promise<ToolResult> {
  try {
    switch (args.action) {
      case "list": {
        const { monitors } = await client.listMonitors();
        if (args.verbose) return ok(JSON.stringify(monitors, null, 2));
        if (monitors.length === 0) return ok(tm.monitors.noMonitors);
        return ok(
          `${t(tm.monitors.title, { count: monitors.length })}\n${monitors.map(formatMonitorCompact).join("\n")}`,
        );
      }
      case "get": {
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "get" }));
        const { monitor } = await client.getMonitor(args.id as string);
        if (args.verbose) return ok(JSON.stringify(monitor, null, 2));
        return ok(
          `${formatMonitorCompact(monitor)}\nID: ${monitor.id}\nInterval: ${monitor.intervalSeconds}s`,
        );
      }
      case "create": {
        if (!args.name) return err(tm.monitors.nameRequired);
        const monitorType = (args.type as string) || "http";
        let config: Record<string, unknown>;
        if (monitorType === "http") {
          if (!args.url && !args.config) return err(tm.monitors.urlOrConfigRequired);
          config = (args.config as Record<string, unknown>) || {
            url: args.url,
            method: "GET",
            expectedStatus: 200,
            timeoutMs: 10000,
          };
        } else {
          if (!args.config) return err(tm.monitors.configRequired);
          config = args.config as Record<string, unknown>;
        }
        const { monitor } = await client.createMonitor({
          type: monitorType as MonitorType,
          name: args.name as string,
          config,
          intervalSeconds: (args.intervalSeconds as number) ?? 300,
        });
        return ok(
          t(tm.monitors.created, { summary: formatMonitorCompact(monitor), id: monitor.id }),
        );
      }
      case "update": {
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "update" }));
        const updateData: Record<string, unknown> = {};
        if (args.name !== undefined) updateData.name = args.name;
        if (args.url !== undefined)
          updateData.config = {
            url: args.url,
            method: "GET",
            expectedStatus: 200,
            timeoutMs: 10000,
          };
        if (args.config !== undefined) updateData.config = args.config;
        if (args.intervalSeconds !== undefined) updateData.intervalSeconds = args.intervalSeconds;
        if (args.isActive !== undefined) updateData.isActive = args.isActive;
        const { monitor } = await client.updateMonitor(args.id as string, updateData);
        return ok(
          t(tm.monitors.updated, { summary: formatMonitorCompact(monitor), id: monitor.id }),
        );
      }
      case "delete": {
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "delete" }));
        await client.deleteMonitor(args.id as string);
        return ok(t(tm.monitors.deleted, { id: args.id as string }));
      }
      case "check": {
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "check" }));
        const { result, monitor } = await client.triggerCheck(args.id as string);
        if (args.verbose) return ok(JSON.stringify({ result, monitor }, null, 2));
        const status =
          result.status === "up"
            ? "🟢 up"
            : result.status === "down"
              ? "🔴 down"
              : `🟡 ${result.status}`;
        const time = result.responseTimeMs !== undefined ? ` (${result.responseTimeMs}ms)` : "";
        const errMsg = result.errorMessage ? `\nError: ${result.errorMessage}` : "";
        return ok(
          `${t(tm.monitors.checkResult, { status })}${time}${errMsg}\nMonitor: ${formatMonitorCompact(monitor)}`,
        );
      }
      case "maintenance": {
        const maintenanceUntil =
          (args.maintenanceUntil as string) ?? new Date(Date.now() + 600 * 1000).toISOString();
        if (args.end) {
          if (args.all) {
            const { updated } = await client.endAllMaintenance(args.notify as boolean | undefined);
            return ok(t(tm.monitors.maintenanceEndedAll, { count: updated }));
          }
          if (args.monitorIds) {
            const ids = (args.monitorIds as string).split(",");
            const { updated } = await client.endBulkMaintenance(
              ids,
              args.notify as boolean | undefined,
            );
            return ok(t(tm.monitors.maintenanceEndedBulk, { count: updated }));
          }
          if (!args.id) return err(t(tm.monitors.idRequired, { action: "maintenance" }));
          const { monitor } = await client.endMaintenance(
            args.id as string,
            args.notify as boolean | undefined,
          );
          return ok(t(tm.monitors.maintenanceEnded, { name: monitor.name, id: monitor.id }));
        }
        if (args.all) {
          const { updated } = await client.startAllMaintenance(
            maintenanceUntil,
            args.notify as boolean | undefined,
          );
          return ok(
            t(tm.monitors.maintenanceStartedAll, { count: updated, until: maintenanceUntil }),
          );
        }
        if (args.monitorIds) {
          const ids = (args.monitorIds as string).split(",");
          const { updated } = await client.startBulkMaintenance(
            ids,
            maintenanceUntil,
            args.notify as boolean | undefined,
          );
          return ok(
            t(tm.monitors.maintenanceStartedBulk, { count: updated, until: maintenanceUntil }),
          );
        }
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "maintenance" }));
        const { monitor } = await client.startMaintenance(
          args.id as string,
          maintenanceUntil,
          args.notify as boolean | undefined,
        );
        return ok(
          t(tm.monitors.maintenanceStarted, {
            name: monitor.name,
            id: monitor.id,
            until: monitor.maintenanceUntil ?? "",
          }),
        );
      }
      case "baseline-reset": {
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "baseline-reset" }));
        const { monitor } = await client.baselineReset(args.id as string);
        return ok(t(tm.monitors.baselineReset, { name: monitor.name, id: monitor.id }));
      }
      case "stats-reset": {
        if (!args.id) return err(t(tm.monitors.idRequired, { action: "stats-reset" }));
        const result = await client.resetMonitorStats(
          args.id as string,
          args.before as string | undefined,
        );
        return ok(`Stats reset: ${result.deletedCount} records deleted`);
      }
      default:
        return err(
          t(tm.monitors.unknownAction, {
            action: args.action as string,
            actions: MONITOR_ACTIONS.join(", "),
          }),
        );
    }
  } catch (e: any) {
    if (e.upgradeUrl) return err(t(tm.monitors.upgradePlan, { msg: e.message, url: e.upgradeUrl }));
    return err(e.message || String(e));
  }
}

async function executeIncidents(
  args: Record<string, unknown>,
  client: ManakoClient,
  tm: Translation,
): Promise<ToolResult> {
  try {
    switch (args.action) {
      case "list": {
        const { incidents } = await client.listIncidents(args.status as IncidentStatus | undefined);
        if (args.verbose) return ok(JSON.stringify(incidents, null, 2));
        if (incidents.length === 0) {
          return ok(
            args.status
              ? t(tm.incidents.noIncidentsWithStatus, { status: args.status as string })
              : tm.incidents.noIncidents,
          );
        }
        return ok(
          `${t(tm.incidents.title, { count: incidents.length })}\n${incidents.map(formatIncidentCompact).join("\n")}`,
        );
      }
      case "acknowledge": {
        if (!args.id) return err(tm.incidents.idRequiredForAck);
        await client.acknowledgeIncident(args.id as string);
        return ok(t(tm.incidents.acknowledged, { id: args.id as string }));
      }
      case "create": {
        if (!args.title) return err(tm.incidents.titleRequired);
        const { incident } = await client.createIncident({
          title: args.title as string,
          cause: args.cause as string | undefined,
          serviceId: args.serviceId as string | undefined,
        });
        return ok(
          t(tm.incidents.created, { summary: formatIncidentCompact(incident), id: incident.id }),
        );
      }
      case "update": {
        if (!args.id) return err(t(tm.incidents.idRequired, { action: "update" }));
        if (!args.title && !args.cause) return err(tm.incidents.titleOrCauseRequired);
        const data: { title?: string; cause?: string } = {};
        if (args.title) data.title = args.title as string;
        if (args.cause) data.cause = args.cause as string;
        const { incident } = await client.updateIncident(args.id as string, data);
        return ok(t(tm.incidents.updated, { summary: formatIncidentCompact(incident) }));
      }
      case "resolve": {
        if (!args.id) return err(t(tm.incidents.idRequired, { action: "resolve" }));
        const { incident } = await client.resolveIncident(
          args.id as string,
          args.cause ? { cause: args.cause as string } : undefined,
        );
        return ok(t(tm.incidents.resolved, { summary: formatIncidentCompact(incident) }));
      }
      case "delete": {
        if (!args.id) return err(t(tm.incidents.idRequired, { action: "delete" }));
        await client.deleteIncident(args.id as string);
        return ok(t(tm.incidents.deleted, { id: args.id as string }));
      }
      default:
        return err(
          t(tm.incidents.unknownAction, {
            action: args.action as string,
            actions: INCIDENT_ACTIONS.join(", "),
          }),
        );
    }
  } catch (e: any) {
    if (e.upgradeUrl)
      return err(t(tm.incidents.upgradePlan, { msg: e.message, url: e.upgradeUrl }));
    return err(e.message || String(e));
  }
}

async function executeServices(
  args: Record<string, unknown>,
  client: ManakoClient,
  tm: Translation,
): Promise<ToolResult> {
  try {
    switch (args.action) {
      case "list": {
        const { services } = await client.listServices();
        if (args.verbose) return ok(JSON.stringify(services, null, 2));
        if (services.length === 0) return ok(tm.services.noServices);
        const summary = services.map(formatServiceCompact).join("\n");
        const hint = services.some((s) => !s.customDomain)
          ? `\n\n${tm.services.customDomainHint}`
          : "";
        return ok(`${t(tm.services.title, { count: services.length })}\n${summary}${hint}`);
      }
      case "stats-reset": {
        if (!args.id) return err("Service ID is required for stats-reset");
        const result = await client.resetServiceStats(
          args.id as string,
          args.before as string | undefined,
        );
        return ok(`Stats reset: ${result.deletedCount} records deleted`);
      }
      default:
        return err(
          t(tm.services.unknownAction, {
            action: args.action as string,
            actions: SERVICE_ACTIONS.join(", "),
          }),
        );
    }
  } catch (e: any) {
    if (e.upgradeUrl) return err(t(tm.services.upgradePlan, { msg: e.message, url: e.upgradeUrl }));
    return err(e.message || String(e));
  }
}

async function executeAuditLogs(
  args: Record<string, unknown>,
  client: ManakoClient,
  tm: Translation,
): Promise<ToolResult> {
  try {
    switch (args.action) {
      case "list": {
        const { auditLogs } = await client.listAuditLogs({
          action: args.actionFilter as string | undefined,
          resourceType: args.resourceType as string | undefined,
          userId: args.userId as string | undefined,
          from: args.from as string | undefined,
          to: args.to as string | undefined,
          limit: args.limit as number | undefined,
        });
        if (args.verbose) return ok(JSON.stringify(auditLogs, null, 2));
        if (auditLogs.length === 0) return ok(tm.auditLogs.noLogs);
        return ok(
          `${t(tm.auditLogs.title, { count: auditLogs.length })}\n\n${auditLogs.map(formatAuditLogCompact).join("\n")}`,
        );
      }
      default:
        return err(
          t(tm.auditLogs.unknownAction, {
            action: args.action as string,
            actions: AUDIT_LOG_ACTIONS.join(", "),
          }),
        );
    }
  } catch (e: any) {
    if (e.upgradeUrl)
      return err(t(tm.auditLogs.upgradePlan, { msg: e.message, url: e.upgradeUrl }));
    return err(e.message || String(e));
  }
}

async function executeNotificationChannels(
  args: Record<string, unknown>,
  client: ManakoClient,
  tm: Translation,
): Promise<ToolResult> {
  try {
    switch (args.action) {
      case "test": {
        if (!args.id) return err(tm.notificationChannels.idRequired);
        await client.testNotificationChannel(args.id as string);
        return ok(t(tm.notificationChannels.testSent, { id: args.id as string }));
      }
      default:
        return err(t(tm.notificationChannels.unknownAction, { action: args.action as string }));
    }
  } catch (e: any) {
    if (e.upgradeUrl)
      return err(t(tm.notificationChannels.upgradePlan, { msg: e.message, url: e.upgradeUrl }));
    return err(e.message || String(e));
  }
}

async function executeWebhookSubscriptions(
  args: Record<string, unknown>,
  client: ManakoClient,
  tm: Translation,
): Promise<ToolResult> {
  try {
    switch (args.action) {
      case "list": {
        const { subscriptions } = await client.listWebhookSubscriptions();
        if (args.verbose) return ok(JSON.stringify(subscriptions, null, 2));
        if (subscriptions.length === 0) return ok(tm.webhookSubscriptions.noSubscriptions);
        const summary = subscriptions
          .map(
            (s: WebhookSubscription) =>
              `${s.id} — ${s.targetUrl} [${s.events.join(", ")}]${s.description ? ` (${s.description})` : ""}`,
          )
          .join("\n");
        return ok(
          `${t(tm.webhookSubscriptions.title, { count: subscriptions.length })}\n${summary}`,
        );
      }
      case "create": {
        if (!args.targetUrl) return err(tm.webhookSubscriptions.targetUrlRequired);
        if (!args.secret) return err(tm.webhookSubscriptions.secretRequired);
        if (!args.events || (args.events as unknown[]).length === 0)
          return err(tm.webhookSubscriptions.eventsRequired);
        const { subscription } = await client.createWebhookSubscription({
          targetUrl: args.targetUrl as string,
          secret: args.secret as string,
          events: args.events as string[],
          description: args.description as string | undefined,
        });
        return ok(
          t(tm.webhookSubscriptions.created, {
            id: subscription.id,
            targetUrl: subscription.targetUrl,
          }),
        );
      }
      case "delete": {
        if (!args.id) return err(t(tm.webhookSubscriptions.idRequired, { action: "delete" }));
        await client.deleteWebhookSubscription(args.id as string);
        return ok(t(tm.webhookSubscriptions.deleted, { id: args.id as string }));
      }
      default:
        return err(
          t(tm.webhookSubscriptions.unknownAction, {
            action: args.action as string,
            actions: WEBHOOK_SUBSCRIPTION_ACTIONS.join(", "),
          }),
        );
    }
  } catch (e: any) {
    if (e.upgradeUrl)
      return err(t(tm.webhookSubscriptions.upgradePlan, { msg: e.message, url: e.upgradeUrl }));
    return err(e.message || String(e));
  }
}

// --- Single dispatcher: only the called tool is executed ---

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  client: ManakoClient,
  tr: Translation,
): Promise<ToolResult> {
  switch (toolName) {
    case "monitors":
      return executeMonitors(args, client, tr);
    case "incidents":
      return executeIncidents(args, client, tr);
    case "services":
      return executeServices(args, client, tr);
    case "audit-logs":
      return executeAuditLogs(args, client, tr);
    case "notification-channels":
      return executeNotificationChannels(args, client, tr);
    case "webhook-subscriptions":
      return executeWebhookSubscriptions(args, client, tr);
    default:
      return {
        content: [{ type: "text", text: `Error: ${t(tr.auth.unknownTool, { name: toolName })}` }],
        isError: true,
      };
  }
}
