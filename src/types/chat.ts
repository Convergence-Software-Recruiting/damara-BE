export const MESSAGE_TYPES = ["text", "image", "file", "system"] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];
