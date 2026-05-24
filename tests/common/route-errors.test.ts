import { describe, expect, it, vi } from "vitest";
import HttpStatusCodes from "../../src/common/constants/HttpStatusCodes";
import {
  buildErrorResponse,
  RouteError,
  sendErrorResponse,
} from "../../src/common/util/route-errors";

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("route error response helpers", () => {
  it("공통 에러 응답 본문을 만든다", () => {
    expect(
      buildErrorResponse("POST_NOT_FOUND", "게시글을 찾을 수 없습니다.", {
        postId: "post-1",
      })
    ).toEqual({
      error: "POST_NOT_FOUND",
      message: "게시글을 찾을 수 없습니다.",
      details: {
        postId: "post-1",
      },
    });
  });

  it("message와 details가 없으면 error 값을 기본 message로 사용한다", () => {
    expect(buildErrorResponse("VALIDATION_ERROR")).toEqual({
      error: "VALIDATION_ERROR",
      message: "VALIDATION_ERROR",
      details: {},
    });
  });

  it("Express 응답에 공통 에러 포맷을 쓴다", () => {
    const res = createResponse();

    sendErrorResponse(
      res as any,
      HttpStatusCodes.BAD_REQUEST,
      "USER_ID_REQUIRED",
      "사용자 ID가 필요합니다."
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "USER_ID_REQUIRED",
      message: "사용자 ID가 필요합니다.",
      details: {},
    });
  });

  it("RouteError는 고정 에러 코드와 사용자 메시지를 분리해 담는다", () => {
    const error = new RouteError(
      HttpStatusCodes.BAD_REQUEST,
      "현재 상태에서는 완료 처리할 수 없습니다.",
      "INVALID_STATUS_TRANSITION",
      { currentStatus: "open", nextStatus: "completed" }
    );

    expect(error.status).toBe(400);
    expect(error.error).toBe("INVALID_STATUS_TRANSITION");
    expect(error.message).toBe("현재 상태에서는 완료 처리할 수 없습니다.");
    expect(error.details).toEqual({
      currentStatus: "open",
      nextStatus: "completed",
    });
  });
});
