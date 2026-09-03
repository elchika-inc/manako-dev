export interface AttachmentInfo {
  r2Key: string;
  filename: string;
  size: number;
  contentType: string;
}

export const CONTACT_CATEGORIES = [
  "general",
  "feature_request",
  "bug_report",
  "billing",
  "other",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export const CONTACT_STATUSES = ["new", "in_progress", "resolved", "closed"] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];
