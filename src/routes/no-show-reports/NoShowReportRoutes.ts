import { Router } from "express";
import {
  cancelNoShowReport,
  confirmNoShowReport,
  getNoShowReportById,
  rejectNoShowReport,
} from "../../controllers/no-show-report.controller";

const noShowReportRouter = Router();

/**
 * @swagger
 * /api/no-show-reports/{id}:
 *   get:
 *     summary: 노쇼 신고 상세 조회
 *     tags: [NoShowReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 노쇼 신고 UUID
 *     responses:
 *       200:
 *         description: 노쇼 신고 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoShowReport'
 *       404:
 *         description: 노쇼 신고를 찾을 수 없음
 */
noShowReportRouter.get("/:id", getNoShowReportById);

/**
 * @swagger
 * /api/no-show-reports/{id}/confirm:
 *   patch:
 *     summary: 노쇼 신고 확정
 *     tags: [NoShowReports]
 *     description: pending 상태의 노쇼 신고를 confirmed로 바꾸고, 신고 대상자의 신뢰학점을 약 0.3 낮춥니다.
 *     parameters:
 *       - in: header
 *         name: x-admin-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 관리자 UUID. ADMIN_USER_IDS 환경변수에 포함되어야 합니다.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 노쇼 신고 UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminUserId:
 *                 type: string
 *                 format: uuid
 *                 description: 관리자 UUID. header x-admin-id 대신 사용할 수 있습니다.
 *     responses:
 *       200:
 *         description: 노쇼 신고 확정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 report:
 *                   $ref: '#/components/schemas/NoShowReport'
 *                 trustEvent:
 *                   nullable: true
 *                   $ref: '#/components/schemas/TrustEvent'
 *       400:
 *         description: 관리자 ID 누락 또는 pending 상태가 아닌 신고
 *       403:
 *         description: 관리자 권한 없음
 *       404:
 *         description: 노쇼 신고 또는 관리자를 찾을 수 없음
 */
noShowReportRouter.patch("/:id/confirm", confirmNoShowReport);

/**
 * @swagger
 * /api/no-show-reports/{id}/reject:
 *   patch:
 *     summary: 노쇼 신고 반려
 *     tags: [NoShowReports]
 *     parameters:
 *       - in: header
 *         name: x-admin-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 관리자 UUID. ADMIN_USER_IDS 환경변수에 포함되어야 합니다.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 노쇼 신고 UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminUserId:
 *                 type: string
 *                 format: uuid
 *                 description: 관리자 UUID. header x-admin-id 대신 사용할 수 있습니다.
 *     responses:
 *       200:
 *         description: 노쇼 신고 반려 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoShowReport'
 *       400:
 *         description: 관리자 ID 누락 또는 pending 상태가 아닌 신고
 *       403:
 *         description: 관리자 권한 없음
 *       404:
 *         description: 노쇼 신고 또는 관리자를 찾을 수 없음
 */
noShowReportRouter.patch("/:id/reject", rejectNoShowReport);

/**
 * @swagger
 * /api/no-show-reports/{id}/cancel:
 *   patch:
 *     summary: 노쇼 신고 취소
 *     tags: [NoShowReports]
 *     description: pending 상태의 노쇼 신고를 취소합니다. 신고자 본인 또는 관리자가 취소할 수 있습니다.
 *     parameters:
 *       - in: header
 *         name: x-admin-id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 관리자 취소 시 사용하는 관리자 UUID. ADMIN_USER_IDS 환경변수에 포함되어야 합니다.
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 노쇼 신고 UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requesterId:
 *                 type: string
 *                 format: uuid
 *                 description: 신고자 본인 취소 시 사용하는 사용자 UUID
 *               adminUserId:
 *                 type: string
 *                 format: uuid
 *                 description: 관리자 UUID. header x-admin-id 대신 사용할 수 있습니다.
 *           example:
 *             requesterId: "a87522bd-bc79-47b0-a73f-46ea4068a158"
 *     responses:
 *       200:
 *         description: 노쇼 신고 취소 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoShowReport'
 *       400:
 *         description: pending 상태가 아닌 신고 또는 관리자 ID 누락
 *       403:
 *         description: 취소 권한 없음
 *       404:
 *         description: 노쇼 신고 또는 관리자를 찾을 수 없음
 */
noShowReportRouter.patch("/:id/cancel", cancelNoShowReport);

export default noShowReportRouter;
