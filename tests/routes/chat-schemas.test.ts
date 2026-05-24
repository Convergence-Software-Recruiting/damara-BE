import { describe, expect, it } from "vitest";
import { createMessageSchema } from "../../src/routes/common/validation/chat-schemas";

const validMessage = {
  chatRoomId: "123e4567-e89b-12d3-a456-426614174000",
  senderId: "a87522bd-bc79-47b0-a73f-46ea4068a158",
  content: "안녕하세요",
};

describe("createMessageSchema", () => {
  it("messageType이 없으면 text로 기본 처리한다", () => {
    const parsed = createMessageSchema.parse({
      message: validMessage,
    });

    expect(parsed.message.messageType).toBe("text");
  });

  it("system 메시지 타입을 허용한다", () => {
    const parsed = createMessageSchema.parse({
      message: {
        ...validMessage,
        messageType: "system",
      },
    });

    expect(parsed.message.messageType).toBe("system");
  });

  it("file 메시지 타입은 공개 요청 계약에서 거부한다", () => {
    expect(() =>
      createMessageSchema.parse({
        message: {
          ...validMessage,
          messageType: "file",
        },
      })
    ).toThrow();
  });
});
