// src/controllers/no-show-report.controller.ts

import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { NoShowReportService } from "../services/NoShowReportService";

/**
 * 노쇼 신고 생성
 * POST /api/posts/:postId/no-show-reports
 */
export async function createNoShowReport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params;
    const { reporterId, reportedUserId, reason } = req.body;

    if (!reporterId) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "REPORTER_ID_REQUIRED",
      });
    }

    if (!reportedUserId) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "REPORTED_USER_ID_REQUIRED",
      });
    }

    const report = await NoShowReportService.createReport({
      postId,
      reporterId,
      reportedUserId,
      reason,
    });

    res.status(HttpStatusCodes.CREATED).json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * 게시글별 노쇼 신고 목록 조회
 * GET /api/posts/:postId/no-show-reports
 */
export async function getNoShowReportsByPost(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;

    const reports = await NoShowReportService.listByPostId(
      postId,
      limit,
      offset
    );

    res.status(HttpStatusCodes.OK).json(reports);
  } catch (error) {
    next(error);
  }
}

/**
 * 노쇼 신고 상세 조회
 * GET /api/no-show-reports/:id
 */
export async function getNoShowReportById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const report = await NoShowReportService.getReport(id);

    res.status(HttpStatusCodes.OK).json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * 노쇼 신고 확정
 * PATCH /api/no-show-reports/:id/confirm
 */
export async function confirmNoShowReport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const result = await NoShowReportService.confirmReport(id);

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 노쇼 신고 반려
 * PATCH /api/no-show-reports/:id/reject
 */
export async function rejectNoShowReport(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const report = await NoShowReportService.rejectReport(id);

    res.status(HttpStatusCodes.OK).json(report);
  } catch (error) {
    next(error);
  }
}
