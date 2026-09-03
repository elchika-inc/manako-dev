/** Minimal KV interface to avoid dependency on @cloudflare/workers-types in shared package. */
interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

/** Resend Free tier limits */
export const RESEND_DAILY_LIMIT = 100;
export const RESEND_MONTHLY_LIMIT = 3000;
export const RESEND_DAILY_WARN = 80;
export const RESEND_MONTHLY_WARN = 2400;

export interface AdminSlackMessage {
  text: string;
  color: string;
}

/**
 * Increment a KV-based quota counter and return the new count.
 * TTL is set to auto-expire the key (daily=24h, monthly=32d).
 *
 * Note: KV does not support atomic increment, so there is a small TOCTOU
 * race window where concurrent requests could both read the same value.
 * This is acceptable because the counter is used for alerting thresholds,
 * not hard rate limiting.
 */
export async function incrementQuotaCounter(
  kv: KVLike,
  key: string,
  ttlSeconds = 86400,
): Promise<number> {
  const raw = await kv.get(key);
  const current = Number(raw ?? "0");
  const next = (Number.isNaN(current) ? 0 : current) + 1;
  await kv.put(key, String(next), { expirationTtl: ttlSeconds });
  return next;
}

/**
 * Check if a quota count has crossed a warning or critical threshold.
 * Returns a Slack message payload if alert needed, null otherwise.
 *
 * Uses === (exact match) to fire exactly once per threshold.
 * A concurrent race could skip a threshold, but the dual-threshold
 * design (warn + limit) provides redundancy.
 */
export function checkQuotaThreshold(
  label: string,
  count: number,
  warnAt: number,
  limit: number,
): AdminSlackMessage | null {
  if (count === limit) {
    return {
      text: `:rotating_light: *${label}* quota REACHED: ${count}/${limit}`,
      color: "#ef4444",
    };
  }
  if (count === warnAt) {
    return {
      text: `:warning: *${label}* quota warning: ${count}/${limit}`,
      color: "#eab308",
    };
  }
  return null;
}

/**
 * Post a message to the admin Slack webhook.
 * Fails silently -- admin alerts must never break user-facing flows.
 */
export async function postAdminSlack(
  webhookUrl: string | undefined,
  message: AdminSlackMessage,
): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attachments: [
          {
            color: message.color,
            blocks: [
              { type: "section", text: { type: "mrkdwn", text: message.text } },
              { type: "context", elements: [{ type: "mrkdwn", text: "Manako Admin Alert" }] },
            ],
          },
        ],
      }),
    });
  } catch {
    // Silent -- admin alerts must never break user-facing flows
  }
}

/**
 * Track a Resend email send: increment daily+monthly counters,
 * alert admin Slack if thresholds are crossed.
 * Call this AFTER a successful Resend API call.
 */
export async function trackResendUsage(kv: KVLike, webhookUrl: string | undefined): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const month = today.slice(0, 7);

    const daily = await incrementQuotaCounter(kv, `quota:resend:${today}`, 86400);
    const monthly = await incrementQuotaCounter(kv, `quota:resend:${month}`, 86400 * 32);

    const dailyAlert = checkQuotaThreshold(
      "Resend daily",
      daily,
      RESEND_DAILY_WARN,
      RESEND_DAILY_LIMIT,
    );
    if (dailyAlert) await postAdminSlack(webhookUrl, dailyAlert);

    const monthlyAlert = checkQuotaThreshold(
      "Resend monthly",
      monthly,
      RESEND_MONTHLY_WARN,
      RESEND_MONTHLY_LIMIT,
    );
    if (monthlyAlert) await postAdminSlack(webhookUrl, monthlyAlert);
  } catch {
    // Silent -- quota tracking must never break email sending
  }
}

/**
 * Build a Slack message for an internal worker error.
 * Intended for unexpected (non-AppError) exceptions that warrant admin attention.
 */
export function buildInternalErrorAlert(
  worker: string,
  error: unknown,
  extra?: Record<string, unknown>,
): AdminSlackMessage {
  const msg = error instanceof Error ? error.message : String(error);
  const fields = extra
    ? Object.entries(extra)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `*${k}*: ${String(v)}`)
        .join("\n")
    : "";
  return {
    text: `:fire: *${worker}* internal error\n\`\`\`${msg}\`\`\`${fields ? `\n${fields}` : ""}`,
    color: "#ef4444",
  };
}
