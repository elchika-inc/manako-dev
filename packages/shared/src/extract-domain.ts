import type { MonitorType } from "./constants.js";

/**
 * Extract the target FQDN from a monitor's config.
 * Returns null for monitor types without external targets.
 * or when the config is invalid.
 */
// oxlint-disable-next-line typescript/no-redundant-type-constituents -- 公開シグネチャの MonitorType を維持する
export function extractTargetDomain(type: MonitorType | string, config: unknown): string | null {
  try {
    if (typeof config !== "object" || config === null) return null;
    const fields = config as Record<string, unknown>;
    switch (type) {
      case "http": {
        const url = fields.url;
        if (typeof url !== "string") return null;
        const parsed = new URL(url);
        return parsed.hostname.toLowerCase();
      }
      case "tcp":
      case "ping": {
        const hostname = fields.hostname;
        if (typeof hostname !== "string") return null;
        return hostname.toLowerCase();
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
