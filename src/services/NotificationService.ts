// src/services/NotificationService.ts

import { NotificationRepo } from "../repos/NotificationRepo";
import { NotificationCreationAttributes } from "../models/Notification";
import PostModel from "../models/Post";
import UserModel from "../models/User";
import { NotificationType } from "../types/notification";
import {
  emitAllNotificationsReadToUser,
  emitNotificationReadToUser,
  emitNotificationToUser,
} from "../config/socketRegistry";

function buildActionUrl(
  data: Pick<
    NotificationCreationAttributes,
    "postId" | "chatRoomId" | "actionUrl"
  >
) {
  if (data.actionUrl) {
    return data.actionUrl;
  }

  if (data.chatRoomId) {
    return `/chat/${data.chatRoomId}`;
  }

  if (data.postId) {
    return `/post/${data.postId}`;
  }

  return null;
}

function withActionUrl(
  data: NotificationCreationAttributes
): NotificationCreationAttributes {
  return {
    ...data,
    actionUrl: buildActionUrl(data),
  };
}

export const NotificationService = {
  /**
   * 알림 생성
   */
  async createNotification(data: NotificationCreationAttributes) {
    const notification = await NotificationRepo.create(withActionUrl(data));
    emitNotificationToUser(notification.userId, notification);
    return notification;
  },

  /**
   * 사용자별 알림 목록 조회
   */
  async getNotifications(
    userId: string,
    limit = 20,
    offset = 0,
    unreadOnly = false
  ) {
    const notifications = await NotificationRepo.findByUserId(
      userId,
      limit,
      offset,
      unreadOnly
    );
    const total = await NotificationRepo.countByUserId(userId);
    const unreadCount = await NotificationRepo.getUnreadCount(userId);

    return {
      notifications,
      unreadCount,
      total,
      limit,
      offset,
      hasNext: offset + notifications.length < total,
    };
  },

  /**
   * 알림 읽음 처리
   */
  async markAsRead(id: string, userId: string) {
    const notification = await NotificationRepo.markAsRead(id, userId);
    emitNotificationReadToUser(userId, notification);
    return notification;
  },

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string) {
    const updatedCount = await NotificationRepo.markAllAsRead(userId);
    emitAllNotificationsReadToUser(userId, { userId, updatedCount });
    return { updatedCount };
  },

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(userId: string) {
    const unreadCount = await NotificationRepo.getUnreadCount(userId);
    return { unreadCount };
  },

  /**
   * 알림 삭제
   */
  async deleteNotification(id: string, userId: string) {
    await NotificationRepo.delete(id, userId);
  },

  /**
   * 새 참여자 알림 생성 (주최자에게)
   */
  async createNewParticipantNotification(
    postId: string,
    participantUserId: string
  ) {
    const post = await PostModel.findByPk(postId);

    if (!post) {
      return;
    }

    const participant = await UserModel.findByPk(participantUserId, {
      attributes: ["id", "nickname"],
    });

    if (!participant) {
      return;
    }

    await NotificationRepo.create({
      userId: post.authorId,
      type: "new_participant",
      title: "새로운 참여자",
      message: `${post.title}에 새로운 참여자가 있습니다.`,
      postId: postId,
      actionUrl: `/post/${postId}`,
      isRead: false,
    });
  },

  /**
   * 참여자 취소 알림 생성 (주최자에게)
   */
  async createParticipantCancelNotification(
    postId: string,
    participantUserId: string
  ) {
    const post = await PostModel.findByPk(postId);

    if (!post) {
      return;
    }

    const participant = await UserModel.findByPk(participantUserId, {
      attributes: ["id", "nickname"],
    });

    if (!participant) {
      return;
    }

    await NotificationRepo.create({
      userId: post.authorId,
      type: "post_status_changed",
      title: "참여자 취소",
      message: `${post.title}에서 참여자가 취소했습니다.`,
      postId: postId,
      actionUrl: `/post/${postId}`,
      isRead: false,
    });
  },

  /**
   * 공동구매 완료 알림 생성
   */
  async createPostCompletedNotification(
    postId: string,
    userIds: string[]
  ) {
    const post = await PostModel.findByPk(postId);

    if (!post) {
      return;
    }

    const notifications = userIds.map((userId) => ({
      userId,
      type: "trade_completed" as NotificationType,
      title: "공동구매 완료",
      message: `${post.title} 공동구매가 완료되었습니다.`,
      postId: postId,
      actionUrl: `/post/${postId}`,
      isRead: false,
    }));

    // 배치로 알림 생성
    for (const notification of notifications) {
      await NotificationRepo.create(notification);
    }
  },

  /**
   * 공동구매 취소 알림 생성
   */
  async createPostCancelledNotification(
    postId: string,
    userIds: string[]
  ) {
    const post = await PostModel.findByPk(postId);

    if (!post) {
      return;
    }

    const notifications = userIds.map((userId) => ({
      userId,
      type: "trade_cancelled" as NotificationType,
      title: "공동구매 취소",
      message: `${post.title} 공동구매가 취소되었습니다.`,
      postId: postId,
      actionUrl: `/post/${postId}`,
      isRead: false,
    }));

    // 배치로 알림 생성
    for (const notification of notifications) {
      await NotificationRepo.create(notification);
    }
  },
};
