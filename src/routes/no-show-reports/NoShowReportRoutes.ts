import { Router } from "express";
import {
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 노쇼 신고 UUID
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
 *         description: pending 상태가 아닌 신고
 *       404:
 *         description: 노쇼 신고를 찾을 수 없음
 */
noShowReportRouter.patch("/:id/confirm", confirmNoShowReport);

/**
 * @swagger
 * /api/no-show-reports/{id}/reject:
 *   patch:
 *     summary: 노쇼 신고 반려
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
 *         description: 노쇼 신고 반려 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoShowReport'
 *       400:
 *         description: pending 상태가 아닌 신고
 *       404:
 *         description: 노쇼 신고를 찾을 수 없음
 */
noShowReportRouter.patch("/:id/reject", rejectNoShowReport);

export default noShowReportRouter;
