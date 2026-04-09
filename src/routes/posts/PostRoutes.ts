import { Router } from "express";

import {
  getAllPosts,
  getPostsByStudentId,
  getPostById,
  createPost,
  updatePost,
  updatePostStatus,
  deletePost,
  joinPost,
  leavePost,
  getParticipants,
  getParticipatedPosts,
  checkParticipation,
} from "../../controllers/post.controller";
import {
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../../controllers/favorite.controller";

const postRouter = Router();

// 디버깅: 라우트 등록 확인
import logger from "jet-logger";
logger.info("PostRoutes: 라우터 초기화됨");

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 전체 상품 조회 (페이징 및 카테고리 필터링 가능)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 조회 개수
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 시작 위치
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [food, daily, beauty, electronics, school, freemarket]
 *         description: "카테고리 필터 (food=먹거리, daily=일상용품, beauty=뷰티·패션, electronics=전자기기, school=학용품, freemarket=프리마켓)"
 *         example: food
 *     responses:
 *       200:
 *         description: 상품 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
// GET /api/posts - 전체 조회 (페이징 가능)
postRouter.get("/", getAllPosts);

/**
 * @swagger
 * /api/posts/student/{studentId}:
 *   get:
 *     summary: 학번으로 상품 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 작성자 학번
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 해당 학번의 상품 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
// GET /api/posts/student/:studentId - 학번으로 상품 조회
postRouter.get("/student/:studentId", getPostsByStudentId);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: 상품 등록
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - post
 *             properties:
 *               post:
 *                 type: object
 *                 required:
 *                   - authorId
 *                   - title
 *                   - content
 *                   - price
 *                   - minParticipants
 *                   - deadline
 *                   - pickupLocation
 *                 properties:
 *                   authorId:
 *                     type: string
 *                     format: uuid
 *                     example: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *                     description: 작성자 UUID
 *                   title:
 *                     type: string
 *                     minLength: 1
 *                     maxLength: 200
 *                     example: "맛있는 치킨 공동구매"
 *                     description: 상품명
 *                   content:
 *                     type: string
 *                     minLength: 1
 *                     example: "BBQ 황금올리브치킨 2마리 세트를 함께 주문하실 분 구합니다!"
 *                     description: 상품 설명
 *                   price:
 *                     type: number
 *                     minimum: 0
 *                     example: 25000
 *                     description: 가격
 *                   minParticipants:
 *                     type: integer
 *                     minimum: 1
 *                     example: 2
 *                     description: 최소 참여 인원
 *                   deadline:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-11-27T23:59:59.000Z"
 *                     description: 마감 시간 (ISO 8601 형식)
 *                   pickupLocation:
 *                     type: string
 *                     maxLength: 200
 *                     example: "명지대학교 정문"
 *                     description: 픽업 장소
 *                   category:
 *                     type: string
 *                     enum: [food, daily, beauty, electronics, school, freemarket]
 *                     nullable: true
 *                     example: "food"
 *                     description: "카테고리 ID (food=먹거리, daily=일상용품, beauty=뷰티·패션, electronics=전자기기, school=학용품, freemarket=프리마켓)"
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       minLength: 1
 *                     example: ["https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400"]
 *                     description: 이미지 URL 배열 (선택사항)
 *           example:
 *             post:
 *               authorId: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *               title: "맛있는 치킨 공동구매"
 *               content: "BBQ 황금올리브치킨 2마리 세트를 함께 주문하실 분 구합니다!"
 *               price: 25000
 *               minParticipants: 2
 *               deadline: "2025-11-27T23:59:59.000Z"
 *               pickupLocation: "명지대학교 정문"
 *               category: "food"
 *               images: ["https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400"]
 *     responses:
 *       201:
 *         description: 상품 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: 유효성 검증 실패
 *       404:
 *         description: 작성자를 찾을 수 없음
 */
// POST /api/posts - 상품 등록
postRouter.post("/", createPost);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: 상품 수정
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               post:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   content:
 *                     type: string
 *                   price:
 *                     type: number
 *                   minParticipants:
 *                     type: integer
 *                   status:
 *                     type: string
 *                     enum: [open, closed, in_progress, completed, cancelled]
 *                   deadline:
 *                     type: string
 *                     format: date-time
 *                   pickupLocation:
 *                     type: string
 *                   category:
 *                     type: string
 *                     enum: [food, daily, beauty, electronics, school, freemarket]
 *                     nullable: true
 *                     description: 카테고리 ID
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *           example:
 *             post:
 *               title: "수정된 제목"
 *               category: "daily"
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: 상품을 찾을 수 없음
 */
// PUT /api/posts/:id - 상품 수정
postRouter.put("/:id", updatePost);

/**
 * @swagger
 * /api/posts/{id}/status:
 *   patch:
 *     summary: 게시글 상태 변경 (작성자만 가능)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 게시글 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - authorId
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, closed, in_progress, completed, cancelled]
 *                 description: 변경할 상태
 *                 example: "closed"
 *               authorId:
 *                 type: string
 *                 format: uuid
 *                 description: 작성자 UUID (권한 확인용)
 *                 example: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *           example:
 *             status: "closed"
 *             authorId: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: 잘못된 상태 전이 또는 요청 데이터
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: 권한 없음 (작성자가 아님)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 *                 message:
 *                   type: string
 *                   example: "작성자만 상태를 변경할 수 있습니다."
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
// PATCH /api/posts/:id/status - 게시글 상태 변경 (작성자만 가능)
// 중요: 이 라우트는 /:id 라우트보다 먼저 정의되어야 함 (더 구체적인 라우트 우선)
postRouter.patch("/:id/status", (req, res, next) => {
  logger.info("=== PATCH /:id/status 라우트 핸들러 호출됨 ===");
  logger.info(`요청 경로: ${req.path}`);
  logger.info(`요청 파라미터: ${JSON.stringify(req.params)}`);
  updatePostStatus(req, res, next);
});
logger.info("✓ PATCH /api/posts/:id/status 라우트 등록됨");

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: 상품 삭제
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       404:
 *         description: 상품을 찾을 수 없음
 */
/**
 * @swagger
 * /api/posts/user/{userId}/participated:
 *   get:
 *     summary: 사용자가 참여한 게시글 목록 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 참여한 게시글 목록 조회 성공
 */
// GET /api/posts/user/:userId/participated - 사용자가 참여한 게시글 목록 (더 구체적인 라우트를 먼저 배치)
postRouter.get("/user/:userId/participated", getParticipatedPosts);

/**
 * @swagger
 * /api/posts/{id}/participants:
 *   get:
 *     summary: 게시글의 참여자 목록 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 참여자 목록 조회 성공
 */
// GET /api/posts/:id/participants - 참여자 목록 (더 구체적인 라우트를 먼저 배치)
postRouter.get("/:id/participants", getParticipants);

/**
 * @swagger
 * /api/posts/{id}/participate/{userId}:
 *   get:
 *     summary: 사용자가 특정 게시글에 참여했는지 확인
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 참여 여부 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isParticipant:
 *                   type: boolean
 */
// GET /api/posts/:id/participate/:userId - 참여 여부 확인 (더 구체적인 라우트를 먼저 배치)
postRouter.get("/:id/participate/:userId", checkParticipation);

/**
 * @swagger
 * /api/posts/{postId}/favorite:
 *   post:
 *     summary: 관심 등록
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 게시글 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: 사용자 UUID
 *           example:
 *             userId: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *     responses:
 *       201:
 *         description: 관심 등록 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 postId:
 *                   type: string
 *                   format: uuid
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 이미 관심 등록됨
 */
// POST /api/posts/:postId/favorite - 관심 등록
postRouter.post("/:postId/favorite", addFavorite);

/**
 * @swagger
 * /api/posts/{postId}/favorite/{userId}:
 *   get:
 *     summary: 관심 여부 확인
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 게시글 UUID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *     responses:
 *       200:
 *         description: 관심 여부 확인 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFavorite:
 *                   type: boolean
 */
// GET /api/posts/:postId/favorite/:userId - 관심 여부 확인
postRouter.get("/:postId/favorite/:userId", checkFavorite);

/**
 * @swagger
 * /api/posts/{postId}/favorite/{userId}:
 *   delete:
 *     summary: 관심 해제
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 게시글 UUID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *     responses:
 *       200:
 *         description: 관심 해제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "관심 해제되었습니다."
 */
// DELETE /api/posts/:postId/favorite/:userId - 관심 해제
postRouter.delete("/:postId/favorite/:userId", removeFavorite);

/**
 * @swagger
 * /api/posts/{id}/participate:
 *   post:
 *     summary: 공동구매 참여
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *           example:
 *             userId: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *     responses:
 *       201:
 *         description: 참여 성공
 *       400:
 *         description: 이미 참여했거나 작성자는 참여할 수 없음
 *       404:
 *         description: 게시글 또는 사용자를 찾을 수 없음
 */
// POST /api/posts/:id/participate - 참여하기 (더 구체적인 라우트를 먼저 배치)
postRouter.post("/:id/participate", joinPost);

/**
 * @swagger
 * /api/posts/{id}/participate/{userId}:
 *   delete:
 *     summary: 공동구매 참여 취소
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 참여 취소 성공
 *       404:
 *         description: 참여 정보를 찾을 수 없음
 */
// DELETE /api/posts/:id/participate/:userId - 참여 취소 (더 구체적인 라우트를 먼저 배치)
postRouter.delete("/:id/participate/:userId", leavePost);

// DELETE /api/posts/:id - 상품 삭제 (일반 라우트는 마지막에 배치)
postRouter.delete("/:id", deletePost);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: 상품 상세 조회
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 상품 UUID
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID (isFavorite 확인용, 선택사항)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID (isFavorite 확인용, 선택사항)
 *     responses:
 *       200:
 *         description: 상품 상세 정보 (favoriteCount, isFavorite 포함)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: 상품을 찾을 수 없음
 */
// GET /api/posts/:id - 상세 조회 (일반 라우트는 마지막에 배치)
// 주의: 더 구체적인 라우트들(:id/participate, :id/participants 등)이 먼저 정의되어야 함
postRouter.get("/:id", getPostById);

export default postRouter;
