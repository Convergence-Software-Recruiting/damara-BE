import { Router } from "express";

import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  login,
  getUserTrustEvents,
  getUserSummary,
  getMyPostsSummary,
  getMyPosts,
} from "../../controllers/user.controller";
import { getFavorites } from "../../controllers/favorite.controller";

const userRouter = Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 전체 사용자 조회
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 건너뛸 항목 수
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
// GET /api/users - 전체 사용자 조회
userRouter.get("/", getAllUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 회원가입
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: object
 *                 required:
 *                   - email
 *                   - passwordHash
 *                   - nickname
 *                   - studentId
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "test@mju.ac.kr"
 *                     description: 명지대학교 이메일 형식 권장
 *                   passwordHash:
 *                     type: string
 *                     minLength: 8
 *                     format: password
 *                     example: "mypassword123"
 *                     description: 비밀번호 (8자 이상, 평문으로 전송하면 서버에서 해시화)
 *                   nickname:
 *                     type: string
 *                     minLength: 2
 *                     example: "홍길동"
 *                     description: 닉네임 (2자 이상)
 *                   studentId:
 *                     type: string
 *                     example: "20241234"
 *                     description: 학번 (필수, unique)
 *                   department:
 *                     type: string
 *                     example: "컴퓨터공학과"
 *                     description: 학과/부서 (선택사항)
 *                   avatarUrl:
 *                     type: string
 *                     format: uri
 *                     example: "https://example.com/avatar.jpg"
 *                     description: 프로필 이미지 URL (선택사항)
 *           example:
 *             user:
 *               email: "test@mju.ac.kr"
 *               passwordHash: "mypassword123"
 *               nickname: "홍길동"
 *               studentId: "20241234"
 *               department: "컴퓨터공학과"
 *               avatarUrl: "http://3.38.145.117:3000/uploads/images/abc123.png"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 유효성 검증 실패 또는 중복된 이메일/학번
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/users - 회원가입
userRouter.post("/", createUser);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: 로그인 (학번 + 비밀번호)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - password
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: 학번
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 잘못된 학번 또는 비밀번호
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// POST /api/users/login - 로그인 (학번 + 비밀번호)
userRouter.post("/login", login);

/**
 * @swagger
 * /api/users/{userId}/favorites:
 *   get:
 *     summary: 내가 관심 등록한 게시글 목록 조회
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
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
 *     responses:
 *       200:
 *         description: 관심 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       postId:
 *                         type: string
 *                         format: uuid
 *                       post:
 *                         $ref: '#/components/schemas/Post'
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   description: 전체 관심 개수
 */
// GET /api/users/:userId/favorites - 내가 관심 등록한 게시글 목록 조회 (더 구체적인 라우트를 먼저 배치)
userRouter.get("/:userId/favorites", getFavorites);

/**
 * @swagger
 * /api/users/{userId}/my-posts:
 *   get:
 *     summary: 내 공구 탭별 카드 목록 조회
 *     description: 등록한 공구, 참여한 공구, 관심 공구 탭의 카드 목록을 검색/상태 필터/페이지네이션과 함께 조회합니다.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *       - in: query
 *         name: tab
 *         schema:
 *           type: string
 *           enum: [registered, participated, favorites]
 *           default: registered
 *         description: 조회할 내 공구 탭
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: "탭별 상태 필터. registered=inProgress/deadlineSoon/completed 또는 게시글 상태, participated=participating/payment_pending/paymentPending/pickup_ready/pickupReady/received 또는 게시글 상태, favorites=deadlineSoon/recent 또는 게시글 상태"
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 검색어. keyword와 동일하게 동작합니다.
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 검색어
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [food, daily, beauty, electronics, school, freemarket]
 *         description: 카테고리 필터
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, deadline, popular]
 *           default: latest
 *         description: 정렬 방식
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
 *         name: deadlineSoonHours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: deadlineSoon 필터 기준 시간
 *       - in: query
 *         name: recentDays
 *         schema:
 *           type: integer
 *           default: 7
 *         description: favorites recent 필터 기준 일수
 *     responses:
 *       200:
 *         description: 내 공구 탭별 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyPostsListResponse'
 *       400:
 *         description: 잘못된 tab 또는 sort
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// GET /api/users/:userId/my-posts - 내 공구 탭별 카드 목록 조회
userRouter.get("/:userId/my-posts", getMyPosts);

/**
 * @swagger
 * /api/users/{userId}/my-posts/summary:
 *   get:
 *     summary: 내 공구 화면 상단 요약 조회
 *     description: 등록한 공구, 참여한 공구, 관심 공구 탭 상단에 표시할 카운트를 한 번에 조회합니다.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *       - in: query
 *         name: deadlineSoonHours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: 마감임박으로 볼 현재 시각 이후 시간 범위
 *       - in: query
 *         name: recentDays
 *         schema:
 *           type: integer
 *           default: 7
 *         description: 최근 추가로 볼 관심 등록 기준 일수
 *     responses:
 *       200:
 *         description: 내 공구 요약 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MyPostsSummary'
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// GET /api/users/:userId/my-posts/summary - 내 공구 탭 상단 요약 조회
userRouter.get("/:userId/my-posts/summary", getMyPostsSummary);

/**
 * @swagger
 * /api/users/{id}/summary:
 *   get:
 *     summary: 마이페이지 통합 요약 조회
 *     description: 마이페이지 첫 렌더링에 필요한 사용자 기본 정보, 공구/채팅/알림 카운트, 신뢰 요약을 한 번에 조회합니다.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *     responses:
 *       200:
 *         description: 마이페이지 요약 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserSummaryResponse'
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// GET /api/users/:id/summary - 마이페이지 통합 요약 조회
userRouter.get("/:id/summary", getUserSummary);

/**
 * @swagger
 * /api/users/{id}/trust-events:
 *   get:
 *     summary: 사용자 신뢰 이벤트 이력 조회
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
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
 *     responses:
 *       200:
 *         description: 신뢰 이벤트 이력 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trustEvents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrustEvent'
 *                 total:
 *                   type: integer
 *                   description: 전체 신뢰 이벤트 개수
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// GET /api/users/:id/trust-events - 사용자 신뢰 이벤트 이력 조회
userRouter.get("/:id/trust-events", getUserTrustEvents);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 사용자 정보 조회
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// GET /api/users/:id - 사용자 정보 조회 (일반 라우트는 마지막에 배치)
userRouter.get("/:id", getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 회원 정보 수정
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                   passwordHash:
 *                     type: string
 *                     minLength: 8
 *                     format: password
 *                   nickname:
 *                     type: string
 *                     minLength: 2
 *                   studentId:
 *                     type: string
 *                   department:
 *                     type: string
 *                   avatarUrl:
 *                     type: string
 *                     format: uri
 *           example:
 *             user:
 *               nickname: "수정된닉네임"
 *               department: "수정된학과"
 *               avatarUrl: "http://3.38.145.117:3000/uploads/images/abc123.png"
 *     responses:
 *       200:
 *         description: 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// PUT /api/users/:id - 회원 수정
userRouter.put("/:id", updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: 회원 삭제
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 UUID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
// DELETE /api/users/:id - 회원 삭제
userRouter.delete("/:id", deleteUser);

export default userRouter;
