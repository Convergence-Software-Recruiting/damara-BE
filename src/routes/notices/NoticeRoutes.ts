import { Router } from "express";
import {
  getNoticeById,
  getNotices,
} from "../../controllers/notice.controller";

const noticeRouter = Router();

/**
 * @swagger
 * /api/notices:
 *   get:
 *     summary: 공지사항 목록 조회
 *     description: 서비스 공지, 이벤트, 점검, 정책 공지를 고정 공지 우선순위와 최신순으로 조회합니다. 운영 DB에 DAMARA 기본 공지가 없거나 일부 누락된 경우 서버 시작 시 기본 공지를 자동 보정합니다. 응답에는 프론트 표시용 category가 포함됩니다.
 *     tags: [Notices]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: 조회 개수
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: 페이지네이션 시작 위치
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [service, event, maintenance, policy]
 *         description: 공지 유형 필터
 *     responses:
 *       200:
 *         description: 공지사항 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoticeListResponse'
 *       400:
 *         description: 잘못된 공지 유형
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
noticeRouter.get("/", getNotices);

/**
 * @swagger
 * /api/notices/{id}:
 *   get:
 *     summary: 공지사항 상세 조회
 *     description: 공지사항 ID로 상세 제목, 요약, 본문, 유형, 프론트 표시용 category, 고정 여부를 조회합니다.
 *     tags: [Notices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 공지사항 UUID
 *     responses:
 *       200:
 *         description: 공지사항 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notice'
 *       404:
 *         description: 공지사항을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
noticeRouter.get("/:id", getNoticeById);

export default noticeRouter;
