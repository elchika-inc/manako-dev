/**
 * Central registry of known API error codes.
 * Import and reference these instead of inline string literals to get
 * compile-time safety across the API ↔ client boundary.
 *
 * @example
 *   // API
 *   throw new AppError(ERROR_CODES.SUDO_REQUIRED, "...", 403);
 *   // Frontend / client
 *   if (error.code === ERROR_CODES.SUDO_REQUIRED) { ... }
 */
export const ERROR_CODES = {
  // Auth
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  PAYMENT_REQUIRED: "PAYMENT_REQUIRED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_SUSPENDED: "ACCOUNT_SUSPENDED",
  ACCOUNT_DELETION_PENDING: "ACCOUNT_DELETION_PENDING",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  EMAIL_IN_USE: "EMAIL_IN_USE",
  SAME_EMAIL: "SAME_EMAIL",
  INVALID_PASSWORD: "INVALID_PASSWORD",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_CODE: "INVALID_CODE",
  INVALID_JSON: "INVALID_JSON",
  INVALID_OPERATION: "INVALID_OPERATION",
  INVALID_PROVIDER: "INVALID_PROVIDER",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_STATUS: "INVALID_STATUS",
  INVALID_TIMEZONE: "INVALID_TIMEZONE",
  INVALID_CONFIG: "INVALID_CONFIG",
  INVALID_DATE: "INVALID_DATE",
  INVALID_PRICE: "INVALID_PRICE",
  INVALID_CHANNEL_TYPE: "INVALID_CHANNEL_TYPE",
  MISSING_TOKEN: "MISSING_TOKEN",
  CODE_REQUIRED: "CODE_REQUIRED",
  PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
  PASSWORD_RESET_REQUIRED: "PASSWORD_RESET_REQUIRED",
  PASSWORD_USER: "PASSWORD_USER",
  SIGNUP_FAILED: "SIGNUP_FAILED",
  RATE_LIMIT: "RATE_LIMIT",
  RATE_LIMITED: "RATE_LIMITED",
  TURNSTILE_FAILED: "TURNSTILE_FAILED",
  TURNSTILE_REQUIRED: "TURNSTILE_REQUIRED",
  // MFA
  MFA_SETUP_REQUIRED: "MFA_SETUP_REQUIRED",
  MFA_SETUP_EXPIRED: "MFA_SETUP_EXPIRED",
  MFA_ALREADY_ENABLED: "MFA_ALREADY_ENABLED",
  MFA_NOT_ENABLED: "MFA_NOT_ENABLED",
  MFA_NOT_CONFIGURED: "MFA_NOT_CONFIGURED",
  TOTP_REQUIRED: "TOTP_REQUIRED",
  // Sudo
  SUDO_REQUIRED: "SUDO_REQUIRED",
  SUDO_LOCKED: "SUDO_LOCKED",
  TOO_MANY_ATTEMPTS: "TOO_MANY_ATTEMPTS",
  // OAuth
  ALREADY_LINKED: "ALREADY_LINKED",
  CANNOT_DISCONNECT: "CANNOT_DISCONNECT",
  NOT_LINKED: "NOT_LINKED",
  NOT_OAUTH_USER: "NOT_OAUTH_USER",
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  // Team & Users
  ALREADY_PENDING: "ALREADY_PENDING",
  ALREADY_VERIFIED: "ALREADY_VERIFIED",
  TEAM_SUSPENDED: "TEAM_SUSPENDED",
  TEAM_NOT_FOUND: "TEAM_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_SUSPENDED: "USER_SUSPENDED",
  // Monitors & Services
  INTERVAL_TOO_SHORT: "INTERVAL_TOO_SHORT",
  MONITOR_INACTIVE: "MONITOR_INACTIVE",
  DEFAULT_SERVICE_NOT_FOUND: "DEFAULT_SERVICE_NOT_FOUND",
  SLUG_TAKEN: "SLUG_TAKEN",
  COOLDOWN: "COOLDOWN",
  CHECK_EXECUTION_FAILED: "CHECK_EXECUTION_FAILED",
  CREATE_FAILED: "CREATE_FAILED",
  UPDATE_READ_BACK_FAILED: "UPDATE_READ_BACK_FAILED",
  // Notifications & Channels
  CHANNEL_INACTIVE: "CHANNEL_INACTIVE",
  UNSUPPORTED_CHANNEL: "UNSUPPORTED_CHANNEL",
  UNSUPPORTED_TYPE: "UNSUPPORTED_TYPE",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  // Billing
  BILLING_ERROR: "BILLING_ERROR",
  BILLING_CHECKOUT_DISABLED: "BILLING_CHECKOUT_DISABLED",
  INVALID_OPERATION_FOR_PLAN: "INVALID_OPERATION_FOR_PLAN",
  // General
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NO_PENDING_DELETION: "NO_PENDING_DELETION",
  API_KEY_EXPIRED: "API_KEY_EXPIRED",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly upgradeUrl?: string;

  constructor(code: string, message: string, status: number = 500, upgradeUrl?: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.upgradeUrl = upgradeUrl;
  }

  toJSON() {
    const error: { code: string; message: string; status: number; upgradeUrl?: string } = {
      code: this.code,
      message: this.message,
      status: this.status,
    };
    if (this.upgradeUrl) {
      error.upgradeUrl = this.upgradeUrl;
    }
    return { error };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource.toUpperCase()}_NOT_FOUND`, `${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message, 403);
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = "Upgrade required", upgradeUrl?: string) {
    super("PAYMENT_REQUIRED", message, 402, upgradeUrl);
  }
}

export class ApiKeyExpiredError extends AppError {
  constructor(message = "API key expired") {
    super("API_KEY_EXPIRED", message, 401);
  }
}
