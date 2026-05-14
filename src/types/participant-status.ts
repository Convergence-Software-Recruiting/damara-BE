export const PARTICIPANT_STATUSES = [
  "participating",
  "payment_pending",
  "pickup_ready",
  "received",
] as const;

export type ParticipantStatus = (typeof PARTICIPANT_STATUSES)[number];

export const PARTICIPANT_STATUS_LABELS: Record<ParticipantStatus, string> = {
  participating: "참여중",
  payment_pending: "입금대기",
  pickup_ready: "수령예정",
  received: "수령완료",
};
