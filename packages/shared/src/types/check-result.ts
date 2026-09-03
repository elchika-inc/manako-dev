export interface CheckResult {
  status: "up" | "down";
  responseTimeMs: number;
  statusCode: number;
  errorMessage: string;
}
