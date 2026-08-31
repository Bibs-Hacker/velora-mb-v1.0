export const VELORA_BRAND = {
  name: "Velora",
  tagline: "Share with intention.",
  storyLifetimeHours: 24,
  maxUploadBytes: 50 * 1024 * 1024,
} as const;

export const MEDIA_SCOPES = ["profile", "post", "story", "message"] as const;
export type MediaScope = (typeof MEDIA_SCOPES)[number];

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const;
export const DOCUMENT_MIME_TYPES = ["application/pdf"] as const;
export const AUDIO_MIME_TYPES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg"] as const;
export const ALLOWED_MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES, ...DOCUMENT_MIME_TYPES, ...AUDIO_MIME_TYPES] as const;

export const NOTIFICATION_TYPES = [
  "follow",
  "like",
  "comment",
  "mention",
  "message",
  "story",
  "report_update",
  "security",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const REPORT_TARGET_TYPES = ["user", "post", "comment", "story", "message"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const ACCOUNT_PRIVACY_MODES = ["public", "private"] as const;
export type AccountPrivacyMode = (typeof ACCOUNT_PRIVACY_MODES)[number];

export const ACCOUNT_STATUS = ["active", "suspended", "deactivated"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUS)[number];

export const MAX_CAPTION_LENGTH = 2_200;
export const MAX_BIO_LENGTH = 160;
export const MAX_COMMENT_LENGTH = 1_000;
export const MAX_MESSAGE_LENGTH = 4_000;

