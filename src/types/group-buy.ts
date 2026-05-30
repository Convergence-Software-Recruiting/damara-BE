export const GROUP_BUY_TYPES = ["pre_recruit", "post_recruit"] as const;

export type GroupBuyType = (typeof GROUP_BUY_TYPES)[number];

export const GROUP_BUY_MODES = ["normal", "price_unlock"] as const;

export type GroupBuyMode = (typeof GROUP_BUY_MODES)[number];

export const GROUP_BUY_TYPE_LABELS: Record<GroupBuyType, string> = {
  pre_recruit: "선모집형",
  post_recruit: "후모집형",
};

export const GROUP_BUY_MODE_LABELS: Record<GroupBuyMode, string> = {
  normal: "기본형",
  price_unlock: "모이면 싸지는 공구",
};
