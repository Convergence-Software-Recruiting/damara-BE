import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
} from "../../controllers/notification.controller";

const notificationRouter = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: 알림 목록 조회
 *     description: 사용자의 알림 목록을 최신순으로 조회합니다. 공동구매에 새 참여자가 생기면 작성자에게 new_participant 타입 알림이 생성됩니다.
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID (또는 query parameter로 userId 전달)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
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
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 읽지 않은 알림만 조회
 *     responses:
 *       200:
 *         description: 알림 목록 조회 성공. new_participant 알림은 postId와 actionUrl을 포함하므로 프론트에서 게시글 상세로 이동시킬 수 있습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 unreadCount:
 *                   type: integer
 *                   description: 읽지 않은 알림 개수
 *                 total:
 *                   type: integer
 *                   description: 전체 알림 개수
 *                 limit:
 *                   type: integer
 *                   description: 조회 개수
 *                 offset:
 *                   type: integer
 *                   description: 시작 위치
 *                 hasNext:
 *                   type: boolean
 *                   description: 다음 페이지 존재 여부
 */
// GET /api/notifications - 알림 목록 조회
notificationRouter.get("/", getNotifications);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: 읽지 않은 알림 개수 조회
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 읽지 않은 알림 개수 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 */
// GET /api/notifications/unread-count - 읽지 않은 알림 개수 조회 (더 구체적인 라우트를 먼저 배치)
notificationRouter.get("/unread-count", getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: 모든 알림 읽음 처리
 *     tags: [Notifications]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 모든 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "모든 알림을 읽음 처리했습니다."
 *                 updatedCount:
 *                   type: integer
 *       400:
 *         description: 사용자 ID 누락 또는 유효성 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PATCH /api/notifications/read-all - 모든 알림 읽음 처리 (더 구체적인 라우트를 먼저 배치)
notificationRouter.patch("/read-all", markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: 알림 읽음 처리
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 알림 ID
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: 알림 읽음 처리 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: 사용자 ID 누락 또는 유효성 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 알림을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// PATCH /api/notifications/:id/read - 알림 읽음 처리 (더 구체적인 라우트를 먼저 배치)
notificationRouter.patch("/:id/read", markNotificationAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: 알림 삭제
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 알림 ID
 *       - in: header
 *         name: x-user-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 알림 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "알림이 삭제되었습니다."
 *       400:
 *         description: 사용자 ID 누락 또는 유효성 검증 실패
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: 알림을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/notifications/:id - 알림 삭제
notificationRouter.delete("/:id", deleteNotification);

export default notificationRouter;
