import { describe, expect, it } from "vitest";
import {
  createPostExceptionSchema,
  updatePostExceptionStatusSchema,
} from "../../src/routes/common/validation/post-exception-schemas";

describe("post exception schemas", () => {
  it("가격 변경 예외 등록 요청을 허용한다", () => {
    const parsed = createPostExceptionSchema.parse({
      exception: {
        reporterId: "123e4567-e89b-12d3-a456-426614174000",
        type: "price_changed",
        reason: "할인 종료로 실제 구매 가격이 상승했습니다.",
        displayTitle: "가격이 변경되었어요",
        displayMessage:
          "할인 종료로 실제 구매 가격이 5,900원에서 6,900원으로 변경되었습니다.",
        severity: "warning",
        oldPrice: 5900,
        newPrice: 6900,
      },
    });

    expect(parsed.exception.type).toBe("price_changed");
    expect(parsed.exception.displayTitle).toBe("가격이 변경되었어요");
    expect(parsed.exception.severity).toBe("warning");
    expect(parsed.exception.oldPrice).toBe(5900);
  });

  it("지원하지 않는 예외 유형은 거부한다", () => {
    const result = createPostExceptionSchema.safeParse({
      exception: {
        type: "refund_requested",
        reason: "환불 요청",
      },
    });

    expect(result.success).toBe(false);
  });

  it("예외 상태 변경 요청을 허용한다", () => {
    const parsed = updatePostExceptionStatusSchema.parse({
      status: "resolved",
      actorUserId: "123e4567-e89b-12d3-a456-426614174000",
      resolutionNote: "참여자 동의 후 변경 가격으로 진행했습니다.",
    });

    expect(parsed.status).toBe("resolved");
  });
});
