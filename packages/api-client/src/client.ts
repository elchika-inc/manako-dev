export interface ManakoClientConfig {
  apiUrl: string;
  apiKey: string;
}

export interface Monitor {
  id: string;
  name: string;
  type: string;
  status: string;
  config: unknown;
  intervalSeconds: number;
  isActive: number;
  lastCheckedAt: string | null;
}

export interface Incident {
  id: string;
  monitorId: string | null;
  type: string;
  status: string;
  title: string | null;
  cause: string | null;
  startedAt: string;
  resolvedAt: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

export interface StatusPage {
  id: string;
  teamId: string;
  slug: string;
  title: string;
  description: string | null;
  isPublic: number;
  customDomain: string | null;
  createdAt: string;
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

    // E7: Handle success response JSON parse failure
    try {
      return await res.json() as T;
    } catch {
      throw { code: "PARSE_ERROR", message: `Invalid JSON response from ${method} ${path}`, status: res.status } as ApiError;
    }
  }

  // Monitors
  async listMonitors(): Promise<{ monitors: Monitor[] }> {
    return this.request("GET", "/monitors");
  }

  async getMonitor(id: string): Promise<{ monitor: Monitor }> {
    return this.request("GET", `/monitors/${encodeURIComponent(id)}`);
  }

  async createMonitor(data: {
    type: string;
    name: string;
    config: Record<string, unknown>;
    intervalSeconds?: number;
  }): Promise<{ monitor: Monitor }> {
    return this.request("POST", "/monitors", data);
  }

  async deleteMonitor(id: string): Promise<{ ok: boolean }> {
    return this.request("DELETE", `/monitors/${encodeURIComponent(id)}`);
  }

  async triggerCheck(id: string): Promise<{
    result: { status: string; responseTimeMs: number; statusCode: number; errorMessage: string };
    monitor: Monitor;
  }> {
    return this.request("POST", `/monitors/${encodeURIComponent(id)}/check`);
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
    return this.request("PUT", `/monitors/${encodeURIComponent(id)}`, data);
  }

  // Incidents
  async listIncidents(status?: string): Promise<{ incidents: Incident[] }> {
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
    return this.request("GET", "/status-pages");
  }
}
