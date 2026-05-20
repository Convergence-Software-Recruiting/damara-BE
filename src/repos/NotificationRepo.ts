// src/repos/NotificationRepo.ts

import NotificationModel, {
  NotificationCreationAttributes,
  NotificationAttributes,
} from "../models/Notification";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { normalizeNotificationType } from "../types/notification";

type NotificationPayload = NotificationAttributes & {
  post?: {
    id: string;
    title: string;
    status: string;
  };
};

function buildActionUrl(payload: NotificationPayload) {
  if (payload.actionUrl) {
    return payload.actionUrl;
  }

  if (payload.chatRoomId) {
    return `/chat/${payload.chatRoomId}`;
  }

  if (payload.postId) {
    return `/post/${payload.postId}`;
  }

  return null;
}

function normalizeNotification(payload: NotificationPayload) {
  return {
    ...payload,
    type: normalizeNotificationType(payload.type),
    actionUrl: buildActionUrl(payload),
  };
}

export const NotificationRepo = {
  /**
   * 알림 생성
   */
  async create(data: NotificationCreationAttributes) {
    const notification = await NotificationModel.create({
      ...data,
      actionUrl: data.actionUrl ?? buildActionUrl(data as NotificationPayload),
      isRead: data.isRead ?? false,
    });
    return normalizeNotification(notification.get() as NotificationPayload);
  },

  /**
   * 사용자별 알림 목록 조회
   */
  async findByUserId(
    userId: string,
    limit = 20,
    offset = 0,
    unreadOnly = false
  ) {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await NotificationModel.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      include: [
        {
          model: (await import("../models/Post")).default,
          as: "post",
          attributes: ["id", "title", "status"],
        },
      ],
    });

    return notifications.map((n) =>
      normalizeNotification(n.get() as NotificationPayload)
    );
  },

  /**
   * 알림 ID로 조회
   */
  async findById(id: string) {
    const notification = await NotificationModel.findByPk(id);
    return notification
      ? normalizeNotification(notification.get() as NotificationPayload)
      : null;
  },

  /**
   * 알림 읽음 처리
   */
  async markAsRead(id: string, userId: string) {
    const notification = await NotificationModel.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NOTIFICATION_NOT_FOUND");
    }

    await notification.update({ isRead: true });
    return normalizeNotification(notification.get() as NotificationPayload);
  },

  /**
   * 사용자의 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string) {
    const [updatedCount] = await NotificationModel.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false,
        },
      }
    );

    return updatedCount;
  },

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(userId: string) {
    return await NotificationModel.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  /**
   * 알림 삭제
   */
  async delete(id: string, userId: string) {
    const deleted = await NotificationModel.destroy({
      where: { id, userId },
    });

    if (deleted === 0) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NOTIFICATION_NOT_FOUND");
    }
  },

  /**
   * 사용자별 전체 알림 개수
   */
  async countByUserId(userId: string) {
    return await NotificationModel.count({
      where: { userId },
    });
  },
};
