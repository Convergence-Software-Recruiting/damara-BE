// src/controllers/notification.controller.ts

import { Request, Response, NextFunction } from "express";
import { NotificationService } from "../services/NotificationService";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { sendErrorResponse } from "../common/util/route-errors";

/**
 * 알림 목록 조회
 * GET /api/notifications
 */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // userId는 헤더나 쿼리에서 가져옴 (인증 시스템 구현 시 토큰에서 추출)
    const userId = (req.headers["x-user-id"] || req.query.userId) as string;

    if (!userId) {
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "USER_ID_REQUIRED",
        "사용자 ID가 필요합니다."
      );
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;
    const unreadOnly = req.query.unreadOnly === "true";

    const result = await NotificationService.getNotifications(
      userId,
      limit,
      offset,
      unreadOnly
    );

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 알림 읽음 처리
 * PATCH /api/notifications/:id/read
 */
export async function markNotificationAsRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = (req.headers["x-user-id"] || req.body.userId) as string;

    if (!userId) {
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "USER_ID_REQUIRED",
        "사용자 ID가 필요합니다."
      );
    }

    const notification = await NotificationService.markAsRead(id, userId);

    res.status(HttpStatusCodes.OK).json(notification);
  } catch (error) {
    next(error);
  }
}

/**
 * 모든 알림 읽음 처리
 * PATCH /api/notifications/read-all
 */
export async function markAllNotificationsAsRead(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.headers["x-user-id"] || req.body.userId) as string;

    if (!userId) {
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "USER_ID_REQUIRED",
        "사용자 ID가 필요합니다."
      );
    }

    const result = await NotificationService.markAllAsRead(userId);

    res.status(HttpStatusCodes.OK).json({
      message: "모든 알림을 읽음 처리했습니다.",
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 읽지 않은 알림 개수 조회
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req.headers["x-user-id"] || req.query.userId) as string;

    if (!userId) {
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "USER_ID_REQUIRED",
        "사용자 ID가 필요합니다."
      );
    }

    const result = await NotificationService.getUnreadCount(userId);

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * 알림 삭제
 * DELETE /api/notifications/:id
 */
export async function deleteNotification(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = (req.headers["x-user-id"] || req.query.userId) as string;

    if (!userId) {
      return sendErrorResponse(
        res,
        HttpStatusCodes.BAD_REQUEST,
        "USER_ID_REQUIRED",
        "사용자 ID가 필요합니다."
      );
    }

    await NotificationService.deleteNotification(id, userId);

    res.status(HttpStatusCodes.OK).json({
      message: "알림이 삭제되었습니다.",
    });
  } catch (error) {
    next(error);
  }
}
