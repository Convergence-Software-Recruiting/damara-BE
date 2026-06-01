import { Router } from "express";
import { getFaqs } from "../../controllers/faq.controller";

const faqRouter = Router();

/**
 * @swagger
 * /api/faqs:
 *   get:
 *     summary: FAQ 목록 조회
 *     description: 거래, 계정, 결제, 수령, 기타 카테고리의 활성 FAQ를 정렬 순서대로 조회합니다. 운영 DB에 DAMARA 기본 FAQ가 없거나 일부 누락된 경우 서버 시작 시 기본 FAQ를 자동 보정합니다.
 *     tags: [Faqs]
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [trade, account, payment, pickup, etc]
 *         description: FAQ 카테고리 필터
 *     responses:
 *       200:
 *         description: FAQ 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FaqListResponse'
 *       400:
 *         description: 잘못된 FAQ 카테고리
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
faqRouter.get("/", getFaqs);

export default faqRouter;
