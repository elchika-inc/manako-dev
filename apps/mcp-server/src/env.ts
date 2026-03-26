export interface Env {
  API_URL: string;
  ENVIRONMENT: "development" | "staging" | "production";
  SESSION_KV: KVNamespace;
}
