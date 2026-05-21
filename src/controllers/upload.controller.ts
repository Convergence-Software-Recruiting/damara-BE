// src/controllers/upload.controller.ts

import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { sendErrorResponse } from "../common/util/route-errors";

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
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "IMAGE_REQUIRED",
        "업로드할 이미지 파일이 필요합니다."
      );
    }

    // 업로드된 파일의 URL 생성
    const imageUrl = `/uploads/images/${req.file.filename}`;

    res.status(HttpStatusCodes.OK).json({
      url: imageUrl,
      filename: req.file.filename,
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
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "IMAGES_REQUIRED",
        "업로드할 이미지 파일이 필요합니다."
      );
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const imageUrls = files.map((file) => ({
      url: `/uploads/images/${file.filename}`,
      filename: file.filename,
    }));

    res.status(HttpStatusCodes.OK).json({
      images: imageUrls,
    });
  } catch (error) {
    next(error);
  }
}
