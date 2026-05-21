import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationAttributes } from "../../src/models/Notification";

const { notificationRepo, socketRegistry } = vi.hoisted(() => ({
  notificationRepo: {
    create: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
  },
  socketRegistry: {
    emitNotificationToUser: vi.fn(),
    emitNotificationReadToUser: vi.fn(),
    emitAllNotificationsReadToUser: vi.fn(),
    emitNotificationDeletedToUser: vi.fn(),
  },
}));

vi.mock("../../src/repos/NotificationRepo", () => ({
  NotificationRepo: notificationRepo,
}));

vi.mock("../../src/config/socketRegistry", () => socketRegistry);

import { NotificationService } from "../../src/services/NotificationService";

function createNotification(
  overrides: Partial<NotificationAttributes> = {}
): NotificationAttributes {
  return {
    id: "notification-1",
    userId: "user-1",
    type: "system_notice",
    title: "테스트 알림",
    message: "테스트 메시지",
    postId: null,
    chatRoomId: null,
    actionUrl: null,
    isRead: false,
    createdAt: new Date("2026-05-21T00:00:00.000Z"),
    updatedAt: new Date("2026-05-21T00:00:00.000Z"),
    ...overrides,
  };
}

describe("NotificationService Socket 이벤트", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("알림 생성 후 notification:new 이벤트를 발행한다", async () => {
    const notification = createNotification();
    notificationRepo.create.mockResolvedValue(notification);

    const result = await NotificationService.createNotification({
      userId: "user-1",
      type: "system_notice",
      title: "테스트 알림",
      message: "테스트 메시지",
    });

    expect(result).toBe(notification);
    expect(notificationRepo.create).toHaveBeenCalledWith({
      userId: "user-1",
      type: "system_notice",
      title: "테스트 알림",
      message: "테스트 메시지",
      actionUrl: null,
    });
    expect(socketRegistry.emitNotificationToUser).toHaveBeenCalledWith(
      "user-1",
      notification
    );
  });

  it("단일 알림 읽음 처리 후 notification:read 이벤트를 발행한다", async () => {
    const notification = createNotification({ isRead: true });
    notificationRepo.markAsRead.mockResolvedValue(notification);

    const result = await NotificationService.markAsRead(
      "notification-1",
      "user-1"
    );

    expect(result).toBe(notification);
    expect(notificationRepo.markAsRead).toHaveBeenCalledWith(
      "notification-1",
      "user-1"
    );
    expect(socketRegistry.emitNotificationReadToUser).toHaveBeenCalledWith(
      "user-1",
      notification
    );
  });

  it("모든 알림 읽음 처리 후 notification:readAll 이벤트를 발행한다", async () => {
    notificationRepo.markAllAsRead.mockResolvedValue(3);

    const result = await NotificationService.markAllAsRead("user-1");

    expect(result).toEqual({ updatedCount: 3 });
    expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith("user-1");
    expect(socketRegistry.emitAllNotificationsReadToUser).toHaveBeenCalledWith(
      "user-1",
      { userId: "user-1", updatedCount: 3 }
    );
  });

  it("알림 삭제 후 notification:delete 이벤트를 발행한다", async () => {
    notificationRepo.delete.mockResolvedValue(undefined);

    await NotificationService.deleteNotification("notification-1", "user-1");

    expect(notificationRepo.delete).toHaveBeenCalledWith(
      "notification-1",
      "user-1"
    );
    expect(socketRegistry.emitNotificationDeletedToUser).toHaveBeenCalledWith(
      "user-1",
      { userId: "user-1", notificationId: "notification-1" }
    );
  });
});
