export interface HttpMonitorConfig {
  url: string;
  method: "GET" | "HEAD" | "POST";
  expectedStatus: number;
  timeoutMs: number;
  headers?: Record<string, string>;
  keyword?: string;
  keywordMustExist?: boolean;
}

export interface TcpMonitorConfig {
  hostname: string;
  port: number;
  timeoutMs: number;
}

export interface PingMonitorConfig {
  hostname: string;
  timeoutMs: number;
  port: number;
}

/**
 * Union of all monitor config types (non-discriminated).
 * Use `MonitorConfigMap` to look up a config type by monitor type,
 * or check the `monitor.type` field before casting.
 */
export type MonitorConfig = HttpMonitorConfig | TcpMonitorConfig | PingMonitorConfig;

/** Discriminated union mapping monitor type to its config. */
export type MonitorConfigMap =
  | { type: "http"; config: HttpMonitorConfig }
  | { type: "tcp"; config: TcpMonitorConfig }
  | { type: "ping"; config: PingMonitorConfig };
