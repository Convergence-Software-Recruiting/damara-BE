import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emitAllNotificationsReadToUser,
  emitNotificationDeletedToUser,
  emitNotificationReadToUser,
  emitNotificationToUser,
  getIO,
  getUserRoom,
  setIO,
} from "../../src/config/socketRegistry";
import type { NotificationAttributes } from "../../src/models/Notification";

function createMockIO() {
  const emit = vi.fn();
  const to = vi.fn(() => ({ emit }));

  return {
    io: { to },
    to,
    emit,
  };
}

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

describe("socketRegistry", () => {
  afterEach(() => {
    setIO(null as never);
    vi.restoreAllMocks();
  });

  it("사용자별 알림 룸 이름을 만든다", () => {
    expect(getUserRoom("user-1")).toBe("user:user-1");
  });

  it("Socket.io 인스턴스를 저장하고 조회한다", () => {
    const { io } = createMockIO();

    setIO(io as never);

    expect(getIO()).toBe(io);
  });

  it("Socket.io 인스턴스가 없으면 알림 이벤트를 무시한다", () => {
    expect(() =>
      emitNotificationToUser("user-1", createNotification())
    ).not.toThrow();
  });

  it("새 알림 이벤트를 사용자 룸에 발행한다", () => {
    const { io, to, emit } = createMockIO();
    const notification = createNotification();
    setIO(io as never);

    emitNotificationToUser("user-1", notification);

    expect(to).toHaveBeenCalledWith("user:user-1");
    expect(emit).toHaveBeenCalledWith("notification:new", notification);
  });

  it("알림 읽음 이벤트를 사용자 룸에 발행한다", () => {
    const { io, to, emit } = createMockIO();
    const notification = createNotification({ isRead: true });
    setIO(io as never);

    emitNotificationReadToUser("user-1", notification);

    expect(to).toHaveBeenCalledWith("user:user-1");
    expect(emit).toHaveBeenCalledWith("notification:read", notification);
  });

  it("모든 알림 읽음 이벤트를 사용자 룸에 발행한다", () => {
    const { io, to, emit } = createMockIO();
    const payload = { userId: "user-1", updatedCount: 3 };
    setIO(io as never);

    emitAllNotificationsReadToUser("user-1", payload);

    expect(to).toHaveBeenCalledWith("user:user-1");
    expect(emit).toHaveBeenCalledWith("notification:readAll", payload);
  });

  it("알림 삭제 이벤트를 사용자 룸에 발행한다", () => {
    const { io, to, emit } = createMockIO();
    const payload = { userId: "user-1", notificationId: "notification-1" };
    setIO(io as never);

    emitNotificationDeletedToUser("user-1", payload);

    expect(to).toHaveBeenCalledWith("user:user-1");
    expect(emit).toHaveBeenCalledWith("notification:delete", payload);
  });
});
