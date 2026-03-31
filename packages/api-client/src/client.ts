import type {
  MonitorType,
  MonitorStatus,
  MonitorConfig,
  IncidentType,
  IncidentStatus,
} from "@manako/shared";

export interface ManakoClientConfig {
  apiUrl: string;
  apiKey: string;
}

export interface Monitor {
  id: string;
  name: string;
  type: MonitorType;
  status: MonitorStatus;
  config: MonitorConfig;
  intervalSeconds: number;
  isActive: boolean;
  lastCheckedAt: string | null;
  maintenanceUntil: string | null;
}

export interface Incident {
  id: string;
  monitorId: string | null;
  type: IncidentType;
  status: IncidentStatus;
  title: string | null;
  cause: string | null;
  startedAt: string;
  resolvedAt: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  upgradeUrl?: string;
}

export interface StatusPage {
  id: string;
  teamId: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  customDomain: string | null;
  customDomainStatus: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  teamId: string;
  userId: string | null;
  userName: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface WebhookSubscription {
  id: string;
  teamId: string;
  targetUrl: string;
  events: string[];
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

// Normalize D1 integer booleans (0/1) to JS booleans
function normalizeMonitor(m: any): Monitor {
  return { ...m, isActive: !!m.isActive };
}

export class ManakoClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(config: ManakoClientConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.apiUrl}/api/v1${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      // E6: Handle non-JSON and unexpected error response formats
      let errorPayload: ApiError;
      try {
        const errBody: any = await res.json();
        if (errBody?.error?.code && errBody?.error?.message) {
          errorPayload = errBody.error;
        } else {
          errorPayload = { code: "UNKNOWN", message: `Request failed (${res.status})`, status: res.status };
        }
      } catch {
        errorPayload = { code: "UNKNOWN", message: `Request failed (${res.status})`, status: res.status };
      }
      throw errorPayload;
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    // E7: Handle success response JSON parse failure
    try {
      return await res.json() as T;
    } catch {
      throw { code: "PARSE_ERROR", message: `Invalid JSON response from ${method} ${path}`, status: res.status } as ApiError;
    }
  }

  // Monitors
  async listMonitors(): Promise<{ monitors: Monitor[] }> {
    const res = await this.request<{ monitors: any[] }>("GET", "/monitors");
    return { monitors: res.monitors.map(normalizeMonitor) };
  }

  async getMonitor(id: string): Promise<{ monitor: Monitor }> {
    const res = await this.request<{ monitor: any }>("GET", `/monitors/${encodeURIComponent(id)}`);
    return { monitor: normalizeMonitor(res.monitor) };
  }

  async createMonitor(data: {
    type: MonitorType;
    name: string;
    config: Record<string, unknown>;
    intervalSeconds?: number;
  }): Promise<{ monitor: Monitor }> {
    const res = await this.request<{ monitor: any }>("POST", "/monitors", data);
    return { monitor: normalizeMonitor(res.monitor) };
  }

  async deleteMonitor(id: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/monitors/${encodeURIComponent(id)}`);
  }

  async updateMonitor(
    id: string,
    data: {
      name?: string;
      config?: Record<string, unknown>;
      intervalSeconds?: number;
      isActive?: boolean;
    },
  ): Promise<{ monitor: Monitor }> {
    const res = await this.request<{ monitor: any }>("PUT", `/monitors/${encodeURIComponent(id)}`, data);
    return { monitor: normalizeMonitor(res.monitor) };
  }

  async startMaintenance(
    id: string,
    maintenanceUntil: string,
    notify?: boolean,
  ): Promise<{ monitor: Monitor }> {
    return this.request("POST", `/monitors/${encodeURIComponent(id)}/maintenance`, { maintenanceUntil, notify });
  }

  async endMaintenance(id: string, notify?: boolean): Promise<{ monitor: Monitor }> {
    return this.request("DELETE", `/monitors/${encodeURIComponent(id)}/maintenance`, notify ? { notify } : undefined);
  }

  async startBulkMaintenance(
    monitorIds: string[],
    maintenanceUntil: string,
    notify?: boolean,
  ): Promise<{ updated: number }> {
    return this.request("POST", "/monitors/bulk/maintenance", { monitorIds, maintenanceUntil, notify });
  }

  async endBulkMaintenance(monitorIds: string[], notify?: boolean): Promise<{ updated: number }> {
    return this.request("DELETE", "/monitors/bulk/maintenance", { monitorIds, notify });
  }

  async startAllMaintenance(maintenanceUntil: string, notify?: boolean): Promise<{ updated: number }> {
    return this.request("POST", "/monitors/all/maintenance", { maintenanceUntil, notify });
  }

  async endAllMaintenance(notify?: boolean): Promise<{ updated: number }> {
    return this.request("DELETE", "/monitors/all/maintenance", notify ? { notify } : undefined);
  }

  async triggerCheck(id: string): Promise<{ result: { status: string; responseTimeMs?: number; errorMessage?: string | null }; monitor: Monitor }> {
    const res = await this.request<{ result: any; monitor: any }>("POST", `/monitors/${encodeURIComponent(id)}/check`);
    return { result: res.result, monitor: normalizeMonitor(res.monitor) };
  }

  async baselineReset(id: string): Promise<{ monitor: Monitor }> {
    const res = await this.request<{ monitor: any }>("POST", `/monitors/${encodeURIComponent(id)}/baseline-reset`);
    return { monitor: normalizeMonitor(res.monitor) };
  }

  async resetMonitorStats(id: string, before?: string): Promise<{ ok: boolean; deletedCount: number }> {
    const query = before ? `?before=${encodeURIComponent(before)}` : "";
    return this.request("DELETE", `/monitors/${encodeURIComponent(id)}/stats${query}`);
  }

  async resetStatusPageStats(id: string, before?: string): Promise<{ ok: boolean; deletedCount: number }> {
    const query = before ? `?before=${encodeURIComponent(before)}` : "";
    return this.request("DELETE", `/status-pages/${encodeURIComponent(id)}/stats${query}`);
  }

  // Incidents
  async listIncidents(status?: IncidentStatus): Promise<{ incidents: Incident[] }> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request("GET", `/incidents${query}`);
  }

  async acknowledgeIncident(id: string): Promise<{ incident: Incident }> {
    return this.request("PUT", `/incidents/${encodeURIComponent(id)}/acknowledge`);
  }

  async createIncident(data: { title: string; cause?: string }): Promise<{ incident: Incident }> {
    return this.request("POST", "/incidents", data);
  }

  async updateIncident(id: string, data: { title?: string; cause?: string }): Promise<{ incident: Incident }> {
    return this.request("PUT", `/incidents/${encodeURIComponent(id)}`, data);
  }

  async resolveIncident(id: string, data?: { cause?: string }): Promise<{ incident: Incident }> {
    return this.request("PUT", `/incidents/${encodeURIComponent(id)}/resolve`, data ?? {});
  }

  async deleteIncident(id: string): Promise<void> {
    await this.request("DELETE", `/incidents/${encodeURIComponent(id)}`);
  }

  // Status Pages
  async listStatusPages(): Promise<{ statusPages: StatusPage[] }> {
    const res = await this.request<{ statusPages: any[] }>("GET", "/status-pages");
    return { statusPages: res.statusPages.map((sp) => ({ ...sp, isPublic: !!sp.isPublic })) };
  }

  // Notification Channels
  async testNotificationChannel(id: string): Promise<{ success: boolean }> {
    return this.request("POST", `/notification-channels/${encodeURIComponent(id)}/test`);
  }

  // Billing
  async getSubscription(): Promise<{ plan: string; modules: string[]; subscription: unknown }> {
    return this.request("GET", "/billing/subscription");
  }

  // Audit Logs
  async listAuditLogs(options?: {
    action?: string;
    resourceType?: string;
    userId?: string;
    from?: string;
    to?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ auditLogs: AuditLog[]; nextCursor: string | null; hasMore: boolean }> {
    const params = new URLSearchParams();
    if (options?.action) params.append("action", options.action);
    if (options?.resourceType) params.append("resourceType", options.resourceType);
    if (options?.userId) params.append("userId", options.userId);
    if (options?.from) params.append("from", options.from);
    if (options?.to) params.append("to", options.to);
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.limit) params.append("limit", String(options.limit));
    const query = params.toString();
    return this.request("GET", `/audit-logs${query ? "?" + query : ""}`);
  }

  // Webhook Subscriptions
  async listWebhookSubscriptions(): Promise<{ subscriptions: WebhookSubscription[] }> {
    return this.request("GET", "/webhook-subscriptions");
  }

  async createWebhookSubscription(data: {
    targetUrl: string;
    secret: string;
    events: string[];
    description?: string;
  }): Promise<{ subscription: WebhookSubscription }> {
    return this.request("POST", "/webhook-subscriptions", data);
  }

  async deleteWebhookSubscription(id: string): Promise<void> {
    await this.request("DELETE", `/webhook-subscriptions/${encodeURIComponent(id)}`);
  }
}
