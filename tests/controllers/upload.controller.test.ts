import { describe, expect, it, vi } from "vitest";
import {
  uploadImage,
  uploadImages,
} from "../../src/controllers/upload.controller";

function createResponse() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("upload.controller", () => {
  it("단일 이미지 업로드 응답에 표준 images 구조와 기존 호환 필드를 함께 반환한다", async () => {
    const req = {
      file: {
        filename: "single.png",
      },
    };
    const res = createResponse();
    const next = vi.fn();

    await uploadImage(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      image: {
        imageUrl: "/uploads/images/single.png",
        sortOrder: 0,
      },
      images: [
        {
          imageUrl: "/uploads/images/single.png",
          sortOrder: 0,
        },
      ],
      url: "/uploads/images/single.png",
      filename: "single.png",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("다중 이미지 업로드 응답에 sortOrder가 포함된 images 배열을 반환한다", async () => {
    const req = {
      files: [{ filename: "first.png" }, { filename: "second.png" }],
    };
    const res = createResponse();
    const next = vi.fn();

    await uploadImages(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      images: [
        {
          imageUrl: "/uploads/images/first.png",
          sortOrder: 0,
        },
        {
          imageUrl: "/uploads/images/second.png",
          sortOrder: 1,
        },
      ],
      imageUrls: [
        {
          imageUrl: "/uploads/images/first.png",
          sortOrder: 0,
          url: "/uploads/images/first.png",
          filename: "first.png",
        },
        {
          imageUrl: "/uploads/images/second.png",
          sortOrder: 1,
          url: "/uploads/images/second.png",
          filename: "second.png",
        },
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("파일이 없는 단일 업로드 요청은 공통 에러 응답을 반환한다", async () => {
    const res = createResponse();
    const next = vi.fn();

    await uploadImage({} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "IMAGE_REQUIRED",
      message: "업로드할 이미지 파일이 필요합니다.",
      details: {},
    });
    expect(next).not.toHaveBeenCalled();
  });
});
