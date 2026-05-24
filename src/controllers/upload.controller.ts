// src/controllers/upload.controller.ts

import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { sendErrorResponse } from "../common/util/route-errors";

type UploadedImage = {
  imageUrl: string;
  sortOrder: number;
};

function toUploadedImage(filename: string, sortOrder: number): UploadedImage {
  return {
    imageUrl: `/uploads/images/${filename}`,
    sortOrder,
  };
}

function normalizeFiles(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
): Express.Multer.File[] {
  if (Array.isArray(files)) {
    return files;
  }

  return Object.values(files).flat();
}

function toUploadedImage(filename: string, sortOrder: number) {
  const imageUrl = `/uploads/images/${filename}`;

  return {
    imageUrl,
    url: imageUrl,
    filename,
    sortOrder,
  };
}

function normalizeUploadedFiles(
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }
) {
  return Array.isArray(files) ? files : Object.values(files).flat();
}

/**
 * 단일 이미지 업로드
 * POST /api/upload/image
 * multipart/form-data: { image: File }
 *
 * - multer.single("image")가 선행되어 req.file을 세팅해준다.
 * - 파일이 없으면 400 에러를 즉시 반환한다.
 * - 업로드된 파일 경로(`/uploads/images/...`)를 프론트에 돌려준다.
 */
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "IMAGE_REQUIRED",
        message: "업로드할 이미지 파일이 필요합니다.",
        details: {},
      });
    }

    // 업로드된 파일의 URL 생성
    const image = toUploadedImage(req.file.filename, 0);

    res.status(HttpStatusCodes.OK).json({
      url: image.imageUrl,
      filename: req.file.filename,
      image,
      images: [image],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 다중 이미지 업로드
 * POST /api/upload/images
 * multipart/form-data: { images: File[] }
 *
 * - multer.array("images", 10)이 req.files 배열을 생성한다.
 * - 파일이 없으면 400
 * - 여러 이미지를 순서(sortOrder) 정보 없이 단순 배열로 반환한다.
 */
export async function uploadImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "IMAGES_REQUIRED",
        message: "업로드할 이미지 파일이 필요합니다.",
        details: {},
      });
    }

    const files = normalizeUploadedFiles(req.files);
    const images = files.map((file, index) =>
      toUploadedImage(file.filename, index)
    );

    res.status(HttpStatusCodes.OK).json({
      images,
      imageUrls: images.map((image) => image.imageUrl),
    });
  } catch (error) {
    next(error);
  }
}
