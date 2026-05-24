// src/routes/upload/UploadRoutes.ts

import { Router } from "express";
import { upload, uploadWithErrorHandling } from "../../config/multer";
import {
  uploadImage,
  uploadImages,
} from "../../controllers/upload.controller";

const uploadRouter = Router();

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: 단일 이미지 업로드
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 이미지 파일 (최대 5MB)
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 업로드된 이미지 URL (기존 클라이언트 호환용)
 *                   example: "/uploads/images/abc123.png"
 *                 filename:
 *                   type: string
 *                   description: 업로드된 파일명 (기존 클라이언트 호환용)
 *                   example: "abc123.png"
 *                 image:
 *                   type: object
 *                   description: 업로드된 이미지 객체
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       example: "/uploads/images/abc123.png"
 *                     url:
 *                       type: string
 *                       description: 기존 클라이언트 호환용 URL
 *                       example: "/uploads/images/abc123.png"
 *                     filename:
 *                       type: string
 *                       example: "abc123.png"
 *                     sortOrder:
 *                       type: integer
 *                       example: 0
 *                 images:
 *                   type: array
 *                   description: 게시글 images 응답과 맞춘 이미지 배열
 *                   items:
 *                     type: object
 *                     properties:
 *                       imageUrl:
 *                         type: string
 *                         example: "/uploads/images/abc123.png"
 *                       url:
 *                         type: string
 *                         description: 기존 클라이언트 호환용 URL
 *                         example: "/uploads/images/abc123.png"
 *                       filename:
 *                         type: string
 *                         example: "abc123.png"
 *                       sortOrder:
 *                         type: integer
 *                         example: 0
 *       400:
 *         description: 이미지 파일 누락, 용량 초과, 형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum: [IMAGE_REQUIRED, UPLOAD_FILE_TOO_LARGE, INVALID_IMAGE_FILE]
 *                   example: UPLOAD_FILE_TOO_LARGE
 *                 message:
 *                   type: string
 *                   example: 이미지 파일은 5MB 이하만 업로드할 수 있습니다.
 *                 details:
 *                   type: object
 */
// 단일 이미지 업로드
// POST /api/upload/image
uploadRouter.post(
  "/image",
  uploadWithErrorHandling(upload.single("image")),
  uploadImage
);

/**
 * @swagger
 * /api/upload/images:
 *   post:
 *     summary: 다중 이미지 업로드 (최대 10개)
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 이미지 파일 배열 (최대 10개, 각각 최대 5MB)
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrls:
 *                   type: array
 *                   description: 기존 클라이언트 호환용 이미지 URL 배열
 *                   items:
 *                     type: string
 *                 images:
 *                   type: array
 *                   description: 게시글 images 응답과 맞춘 이미지 객체 배열
 *                   items:
 *                     type: object
 *                     properties:
 *                       imageUrl:
 *                         type: string
 *                         example: "/uploads/images/abc123.png"
 *                       url:
 *                         type: string
 *                         description: 기존 클라이언트 호환용 URL
 *                         example: "/uploads/images/abc123.png"
 *                       filename:
 *                         type: string
 *                         example: "abc123.png"
 *                       sortOrder:
 *                         type: integer
 *                         example: 0
 *       400:
 *         description: 이미지 파일 누락, 용량 초과, 형식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum: [IMAGES_REQUIRED, UPLOAD_FILE_TOO_LARGE, INVALID_IMAGE_FILE]
 *                   example: UPLOAD_FILE_TOO_LARGE
 *                 message:
 *                   type: string
 *                   example: 이미지 파일은 5MB 이하만 업로드할 수 있습니다.
 *                 details:
 *                   type: object
 */
// 다중 이미지 업로드
// POST /api/upload/images
uploadRouter.post(
  "/images",
  uploadWithErrorHandling(upload.array("images", 10)),
  uploadImages
);

export default uploadRouter;
