import multer from "multer";
import { describe, expect, it, vi } from "vitest";
import { uploadWithErrorHandling } from "../../src/config/multer";

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("uploadWithErrorHandling", () => {
  it("multer 파일 용량 초과를 고정 에러 포맷으로 반환한다", () => {
    const middleware = vi.fn((_req, _res, next) => {
      next(new multer.MulterError("LIMIT_FILE_SIZE"));
    });
    const wrapped = uploadWithErrorHandling(middleware as any);
    const res = createResponse();
    const next = vi.fn();

    wrapped({} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "UPLOAD_FILE_TOO_LARGE",
      message: "이미지 파일은 5MB 이하만 업로드할 수 있습니다.",
      details: {
        limitBytes: 5242880,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("이미지가 아닌 파일 오류를 고정 에러 포맷으로 반환한다", () => {
    const middleware = vi.fn((_req, _res, next) => {
      next(new Error("이미지 파일만 업로드 가능합니다."));
    });
    const wrapped = uploadWithErrorHandling(middleware as any);
    const res = createResponse();
    const next = vi.fn();

    wrapped({} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "INVALID_IMAGE_FILE",
      message: "이미지 파일만 업로드 가능합니다.",
      details: {},
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("업로드 미들웨어가 성공하면 다음 핸들러로 넘긴다", () => {
    const middleware = vi.fn((_req, _res, next) => {
      next();
    });
    const wrapped = uploadWithErrorHandling(middleware as any);
    const res = createResponse();
    const next = vi.fn();

    wrapped({} as any, res as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
