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
  it("단일 이미지 업로드 응답에 기존 필드와 공통 images 배열을 함께 반환한다", async () => {
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
      url: "/uploads/images/single.png",
      filename: "single.png",
      image: {
        imageUrl: "/uploads/images/single.png",
        url: "/uploads/images/single.png",
        filename: "single.png",
        sortOrder: 0,
      },
      images: [
        {
          imageUrl: "/uploads/images/single.png",
          url: "/uploads/images/single.png",
          filename: "single.png",
          sortOrder: 0,
        },
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("다중 이미지 업로드 응답에 imageUrl과 sortOrder를 포함한다", async () => {
    const req = {
      files: [
        { filename: "first.png" },
        { filename: "second.png" },
      ],
    };
    const res = createResponse();
    const next = vi.fn();

    await uploadImages(req as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      images: [
        {
          imageUrl: "/uploads/images/first.png",
          url: "/uploads/images/first.png",
          filename: "first.png",
          sortOrder: 0,
        },
        {
          imageUrl: "/uploads/images/second.png",
          url: "/uploads/images/second.png",
          filename: "second.png",
          sortOrder: 1,
        },
      ],
      imageUrls: ["/uploads/images/first.png", "/uploads/images/second.png"],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("파일이 없으면 명시적인 업로드 에러를 반환한다", async () => {
    const res = createResponse();
    const next = vi.fn();

    await uploadImage({} as any, res as any, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "IMAGE_REQUIRED",
      message: "업로드할 이미지 파일이 필요합니다.",
      details: {},
    });
  });
});
