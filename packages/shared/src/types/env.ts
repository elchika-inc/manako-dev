/**
 * Base Cloudflare Worker environment bindings shared across apps.
 *
 * Generic parameters allow packages/shared to remain free of
 * @cloudflare/workers-types while each app supplies its concrete types.
 *
 * @typeParam TDB - D1Database
 * @typeParam TKV - KVNamespace
 * @typeParam TAnalytics - AnalyticsEngineDataset
 * @typeParam TQueue - Queue (e.g. Queue of NotificationMessage)
 */
export interface BaseWorkerEnv<
  TDB = unknown,
  TKV = unknown,
  TAnalytics = unknown,
  TQueue = unknown,
> {
  /** D1 primary database */
  DB: TDB;
  /** KV namespace for caching, rate limiting, sessions */
  KV: TKV;
  /** Analytics Engine dataset for check results */
  ANALYTICS: TAnalytics;
  /** Analytics Engine dataset for worker-level metrics */
  WORKER_METRICS: TAnalytics;
  /** Queue for notification messages */
  NOTIFICATION_QUEUE: TQueue;
  /** Runtime environment */
  ENVIRONMENT: "development" | "staging" | "production";
}
