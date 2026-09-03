export const MONITOR_STATUS = {
  UP: "up",
  DOWN: "down",
  DEGRADED: "degraded",
  UNKNOWN: "unknown",
  PAUSED: "paused",
} as const;

export type MonitorStatus = (typeof MONITOR_STATUS)[keyof typeof MONITOR_STATUS];

export const MONITOR_TYPE = {
  HTTP: "http",
  TCP: "tcp",
  PING: "ping",
} as const;

export type MonitorType = (typeof MONITOR_TYPE)[keyof typeof MONITOR_TYPE];

export const INCIDENT_STATUS = {
  ONGOING: "ongoing",
  RESOLVED: "resolved",
  ACKNOWLEDGED: "acknowledged",
} as const;

export type IncidentStatus = (typeof INCIDENT_STATUS)[keyof typeof INCIDENT_STATUS];

export const INCIDENT_TYPE = {
  AUTO: "auto",
  MANUAL: "manual",
  CHANGE: "change",
  WARNING: "warning",
} as const;

export type IncidentType = (typeof INCIDENT_TYPE)[keyof typeof INCIDENT_TYPE];

export const NOTIFICATION_CHANNEL_TYPE = {
  EMAIL: "email",
  SLACK: "slack",
  DISCORD: "discord",
  LINE: "line",
  WEBHOOK: "webhook",
  GITHUB: "github",
} as const;

export type NotificationChannelType =
  (typeof NOTIFICATION_CHANNEL_TYPE)[keyof typeof NOTIFICATION_CHANNEL_TYPE];

export const USER_ROLE = {
  OWNER: "owner",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

/**
 * Refresh token の有効期間（秒）。KV TTL と refresh Cookie の maxAge の双方で参照する。
 */
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Number of consecutive down checks required before creating an incident */
export const INCIDENT_CONFIRM_COUNT = 5;

/** monitor-worker と API が共有する連続失敗カウンターの KV キーを返す。 */
export function consecutiveDownKey(monitorId: string): string {
  return `consecutive-down:${monitorId}`;
}

/** Flap suppression: suppress if M status changes within N minutes */
export const FLAP_WINDOW_MINUTES = 10;
export const FLAP_THRESHOLD = 3;
