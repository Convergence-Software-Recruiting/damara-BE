export const MESSAGE_TYPES = ["text", "image", "system"] as const;

export const LEGACY_MESSAGE_TYPES = ["file"] as const;

export const STORED_MESSAGE_TYPES = [
  ...MESSAGE_TYPES,
  ...LEGACY_MESSAGE_TYPES,
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export type StoredMessageType = (typeof STORED_MESSAGE_TYPES)[number];

export function isMessageType(value: unknown): value is MessageType {
  return (
    typeof value === "string" &&
    (MESSAGE_TYPES as readonly string[]).includes(value)
  );
}
