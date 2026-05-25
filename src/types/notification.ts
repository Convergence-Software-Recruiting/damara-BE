export const NOTIFICATION_TYPES = [
  "new_participant",
  "post_deadline_soon",
  "post_closed",
  "post_status_changed",
  "new_chat_message",
  "favorite_post_deadline_soon",
  "post_exception",
  "trade_completed",
  "trade_cancelled",
  "system_notice",
] as const;

export const LEGACY_NOTIFICATION_TYPES = [
  "participant_cancel",
  "deadline_soon",
  "post_completed",
  "post_cancelled",
  "favorite_deadline",
  "favorite_completed",
] as const;

export const STORED_NOTIFICATION_TYPES = [
  ...NOTIFICATION_TYPES,
  ...LEGACY_NOTIFICATION_TYPES,
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type StoredNotificationType =
  (typeof STORED_NOTIFICATION_TYPES)[number];

export const LEGACY_NOTIFICATION_TYPE_MAP: Record<
  (typeof LEGACY_NOTIFICATION_TYPES)[number],
  NotificationType
> = {
  participant_cancel: "post_status_changed",
  deadline_soon: "post_deadline_soon",
  post_completed: "trade_completed",
  post_cancelled: "trade_cancelled",
  favorite_deadline: "favorite_post_deadline_soon",
  favorite_completed: "trade_completed",
};

export function normalizeNotificationType(
  type: StoredNotificationType
): NotificationType {
  if ((LEGACY_NOTIFICATION_TYPES as readonly string[]).includes(type)) {
    return LEGACY_NOTIFICATION_TYPE_MAP[
      type as (typeof LEGACY_NOTIFICATION_TYPES)[number]
    ];
  }

  return type as NotificationType;
}
