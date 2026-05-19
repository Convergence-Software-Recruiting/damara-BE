export const NOTICE_TYPES = [
  "service",
  "event",
  "maintenance",
  "policy",
] as const;

export type NoticeType = (typeof NOTICE_TYPES)[number];
