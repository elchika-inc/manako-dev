/** Per-channel configuration types for notification channels. */

export interface EmailChannelConfig {
  to: string;
}

export interface SlackChannelConfig {
  webhookUrl: string;
}

export interface DiscordChannelConfig {
  webhookUrl: string;
}

export interface LineChannelConfig {
  channelAccessToken: string;
  to: string;
}

export interface WebhookChannelConfig {
  url: string;
  secret: string;
}

export interface GitHubChannelConfig {
  token: string;
  owner: string;
  repo: string;
  labels?: string[];
}

/**
 * Union of all notification channel config types (non-discriminated).
 * Use `NotificationChannelConfigMap` to look up a config type by channel type,
 * or check the `channel.type` field before casting.
 */
export type NotificationChannelConfig =
  | EmailChannelConfig
  | SlackChannelConfig
  | DiscordChannelConfig
  | LineChannelConfig
  | WebhookChannelConfig
  | GitHubChannelConfig;

/** Discriminated union mapping channel type to its config. */
export type NotificationChannelConfigMap =
  | { type: "email"; config: EmailChannelConfig }
  | { type: "slack"; config: SlackChannelConfig }
  | { type: "discord"; config: DiscordChannelConfig }
  | { type: "line"; config: LineChannelConfig }
  | { type: "webhook"; config: WebhookChannelConfig }
  | { type: "github"; config: GitHubChannelConfig };
