export const POST_EXCEPTION_TYPES = [
  "price_changed",
  "sold_out",
  "pickup_changed",
  "damaged",
  "seller_cancelled",
  "other",
] as const;

export const POST_EXCEPTION_STATUSES = [
  "open",
  "resolved",
  "dismissed",
] as const;

export const POST_EXCEPTION_SEVERITIES = [
  "info",
  "warning",
  "critical",
] as const;

export type PostExceptionType = (typeof POST_EXCEPTION_TYPES)[number];
export type PostExceptionStatus = (typeof POST_EXCEPTION_STATUSES)[number];
export type PostExceptionSeverity =
  (typeof POST_EXCEPTION_SEVERITIES)[number];

export const POST_EXCEPTION_TYPE_LABELS: Record<PostExceptionType, string> = {
  price_changed: "가격 변경",
  sold_out: "품절",
  pickup_changed: "수령 정보 변경",
  damaged: "파손/누락/불량",
  seller_cancelled: "주최자 취소",
  other: "기타 예외",
};

export const POST_EXCEPTION_HANDLING_GUIDES: Record<
  PostExceptionType,
  string
> = {
  price_changed: "참여자에게 알리고 계속 참여 또는 취소 여부를 확인하세요.",
  sold_out: "참여자에게 즉시 알리고 공구 취소 또는 대체 상품 여부를 안내하세요.",
  pickup_changed: "변경된 수령 장소나 시간을 참여자에게 안내하고 확인을 받으세요.",
  damaged: "파손, 누락, 불량 수량을 기록하고 비용 차감 또는 중재가 필요합니다.",
  seller_cancelled: "참여자에게 취소 사유를 알리고 게시글 상태 취소 처리를 진행하세요.",
  other: "상황을 구체적으로 기록하고 참여자에게 필요한 후속 조치를 안내하세요.",
};

export const POST_EXCEPTION_DEFAULT_SEVERITY: Record<
  PostExceptionType,
  PostExceptionSeverity
> = {
  price_changed: "warning",
  sold_out: "critical",
  pickup_changed: "info",
  damaged: "critical",
  seller_cancelled: "critical",
  other: "warning",
};

export const POST_EXCEPTION_DEFAULT_DISPLAY_TITLES: Record<
  PostExceptionType,
  string
> = {
  price_changed: "가격이 변경되었어요",
  sold_out: "상품이 품절되었어요",
  pickup_changed: "수령 정보가 변경되었어요",
  damaged: "상품 파손/누락 이슈가 있어요",
  seller_cancelled: "주최자가 공구를 취소했어요",
  other: "공구 예외 상황이 등록되었어요",
};
