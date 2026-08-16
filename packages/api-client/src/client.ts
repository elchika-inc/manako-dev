import type {
  MonitorType,
  MonitorStatus,
  MonitorConfig,
  IncidentType,
  IncidentStatus,
  CheckResult,
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
  serviceId: string;
  startedAt: string;
  resolvedAt: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  upgradeUrl?: string;
}

// #1246: プレーンオブジェクトを throw すると CLI 等で String(err) が "[object Object]" になるため、
// Error インスタンスとして throw する。プロパティ (code/status/upgradeUrl) は ApiError 互換。
// 注意: upgradeUrl は `declare` で型のみ宣言する。ES2022 の useDefineForClassFields で
// 通常のフィールド宣言をすると own property が常に define され、消費側の
// `"upgradeUrl" in err` 判定が誤爆するため、値がある時のみ代入する。
export class ManakoApiError extends Error {
  code: string;
  status: number;
  declare upgradeUrl?: string;

  constructor(payload: ApiError) {
    super(payload.message);
    this.name = "ManakoApiError";
    this.code = payload.code;
    this.status = payload.status;
    if (payload.upgradeUrl !== undefined) {
      this.upgradeUrl = payload.upgradeUrl;
    }
  }
}

type RawService = Omit<Service, "isPublic"> & { isPublic: boolean | number };

/** Normalize D1 integer flags on service rows to booleans. */
function normalizeService(raw: RawService): Service {
  return { ...raw, isPublic: !!raw.isPublic };
}

export interface Service {
  id: string;
  teamId: string;
  slug: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  maintenanceUntil: string | null;
  createdAt: string;
  updatedAt: string;
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

/** Raw monitor shape from D1 — isActive may be 0/1 instead of boolean */
interface RawMonitor extends Omit<Monitor, "isActive"> {
  isActive: boolean | number;
}

// Normalize D1 integer booleans (0/1) to JS booleans
function normalizeMonitor(m: RawMonitor): Monitor {
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
        Authorization: `Bearer ${this.apiKey}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      // E6: Handle non-JSON and unexpected error response formats
      let errorPayload: ApiError;
      try {
        const errBody = (await res.json()) as {
          error?: { code?: string; message?: string; status?: number; upgradeUrl?: string };
        };
        if (errBody?.error?.code && errBody?.error?.message) {
          errorPayload = errBody.error as ApiError;
        } else {
          errorPayload = {
            code: "UNKNOWN",
            message: `Request failed (${res.status})`,
            status: res.status,
          };
        }
      } catch {
        errorPayload = {
          code: "UNKNOWN",
          message: `Request failed (${res.status})`,
          status: res.status,
        };
      }
      throw new ManakoApiError(errorPayload);
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return undefined as T;
    }

    // E7: Handle success response JSON parse failure
    try {
      return (await res.json()) as T;
    } catch {
      throw new ManakoApiError({
        code: "PARSE_ERROR",
        message: `Invalid JSON response from ${method} ${path}`,
        status: res.status,
      });
    }
  }

  // Monitors
  async listMonitors(): Promise<{ monitors: Monitor[] }> {
    const res = await this.request<{ monitors: RawMonitor[] }>("GET", "/monitors");
    return { monitors: res.monitors.map(normalizeMonitor) };
  }

  async getMonitor(id: string): Promise<{ monitor: Monitor }> {
    const res = await this.request<{ monitor: RawMonitor }>(
      "GET",
      `/monitors/${encodeURIComponent(id)}`,
    );
    return { monitor: normalizeMonitor(res.monitor) };
  }

  async createMonitor(data: {
    type: MonitorType;
    name: string;
    config: Record<string, unknown>;
    intervalSeconds?: number;
    serviceId?: string;
  }): Promise<{ monitor: Monitor }> {
    const res = await this.request<{ monitor: RawMonitor }>("POST", "/monitors", data);
    return {
      monitor: normalizeMonitor(res.monitor),
    };
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
    const res = await this.request<{ monitor: RawMonitor }>(
      "PUT",
      `/monitors/${encodeURIComponent(id)}`,
      data,
    );
    return { monitor: normalizeMonitor(res.monitor) };
  }

  async startMaintenance(
    id: string,
    maintenanceUntil: string,
    notify?: boolean,
  ): Promise<{ monitor: Monitor }> {
    return this.request("POST", `/monitors/${encodeURIComponent(id)}/maintenance`, {
      maintenanceUntil,
      notify,
    });
  }

  async endMaintenance(id: string, notify?: boolean): Promise<{ monitor: Monitor }> {
    return this.request(
      "DELETE",
      `/monitors/${encodeURIComponent(id)}/maintenance`,
      notify ? { notify } : undefined,
    );
  }

  async startBulkMaintenance(
    monitorIds: string[],
    maintenanceUntil: string,
    notify?: boolean,
  ): Promise<{ updated: number }> {
    return this.request("POST", "/monitors/bulk/maintenance", {
      monitorIds,
      maintenanceUntil,
      notify,
    });
  }

  async endBulkMaintenance(monitorIds: string[], notify?: boolean): Promise<{ updated: number }> {
    return this.request("DELETE", "/monitors/bulk/maintenance", { monitorIds, notify });
  }

  async startAllMaintenance(
    maintenanceUntil: string,
    notify?: boolean,
  ): Promise<{ updated: number }> {
    return this.request("POST", "/monitors/all/maintenance", { maintenanceUntil, notify });
  }

  async endAllMaintenance(notify?: boolean): Promise<{ updated: number }> {
    return this.request("DELETE", "/monitors/all/maintenance", notify ? { notify } : undefined);
  }

  // status は API 側の executeCheck() が返す CheckResult をそのまま JSON 化したもの。
  // 正本 (@manako/shared の CheckResult) を参照して二重管理を避ける。
  async triggerCheck(id: string): Promise<{
    result: {
      status: CheckResult["status"];
      responseTimeMs?: number;
      errorMessage?: string | null;
    };
    monitor: Monitor;
  }> {
    const res = await this.request<{
      result: {
        status: CheckResult["status"];
        responseTimeMs?: number;
        errorMessage?: string | null;
      };
      monitor: RawMonitor;
    }>("POST", `/monitors/${encodeURIComponent(id)}/check`);
    return { result: res.result, monitor: normalizeMonitor(res.monitor) };
  }

  async resetMonitorStats(
    id: string,
    before?: string,
  ): Promise<{ ok: boolean; deletedCount: number }> {
    const query = before ? `?before=${encodeURIComponent(before)}` : "";
    return this.request("DELETE", `/monitors/${encodeURIComponent(id)}/stats${query}`);
  }

  async resetServiceStats(
    id: string,
    before?: string,
  ): Promise<{ ok: boolean; deletedCount: number }> {
    const query = before ? `?before=${encodeURIComponent(before)}` : "";
    return this.request("DELETE", `/services/${encodeURIComponent(id)}/stats${query}`);
  }

  // Incidents
  async listIncidents(status?: IncidentStatus): Promise<{ incidents: Incident[] }> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request("GET", `/incidents${query}`);
  }

  async acknowledgeIncident(id: string): Promise<{ incident: Incident }> {
    return this.request("PUT", `/incidents/${encodeURIComponent(id)}/acknowledge`);
  }

  async createIncident(data: {
    title: string;
    cause?: string;
    serviceId?: string;
  }): Promise<{ incident: Incident }> {
    return this.request("POST", "/incidents", data);
  }

  async updateIncident(
    id: string,
    data: { title?: string; cause?: string },
  ): Promise<{ incident: Incident }> {
    return this.request("PUT", `/incidents/${encodeURIComponent(id)}`, data);
  }

  async resolveIncident(id: string, data?: { cause?: string }): Promise<{ incident: Incident }> {
    return this.request("PUT", `/incidents/${encodeURIComponent(id)}/resolve`, data ?? {});
  }

  async deleteIncident(id: string): Promise<void> {
    await this.request("DELETE", `/incidents/${encodeURIComponent(id)}`);
  }

  // Services
  async listServices(): Promise<{ services: Service[] }> {
    const res = await this.request<{ services: RawService[] }>("GET", "/services");
    return { services: res.services.map(normalizeService) };
  }

  async createService(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<{ service: Service }> {
    const res = await this.request<{ service: RawService }>("POST", "/services", data);
    return { service: normalizeService(res.service) };
  }

  async updateService(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      isPublic?: boolean;
    },
  ): Promise<{ service: Service }> {
    const res = await this.request<{ service: RawService }>(
      "PUT",
      `/services/${encodeURIComponent(id)}`,
      data,
    );
    return { service: normalizeService(res.service) };
  }

  async deleteService(id: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/services/${encodeURIComponent(id)}`);
  }

  // Notification Channels
  async testNotificationChannel(id: string): Promise<{ success: boolean }> {
    return this.request("POST", `/notification-channels/${encodeURIComponent(id)}/test`);
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
}

export function isApiKeyExpired(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as ApiError).code === "API_KEY_EXPIRED"
  );
}
