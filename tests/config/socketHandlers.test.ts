import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => {
  const handlers: Record<string, (payload: any) => unknown> = {};
  const socketRoomEmit = vi.fn();
  const ioRoomEmit = vi.fn();
  let connectionHandler: ((socket: any) => void) | null = null;

  const socket = {
    id: "socket-1",
    on: vi.fn((event: string, handler: (payload: any) => unknown) => {
      handlers[event] = handler;
    }),
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
    to: vi.fn(() => ({ emit: socketRoomEmit })),
  };

  const server = {
    on: vi.fn((event: string, handler: (socket: any) => void) => {
      if (event === "connection") {
        connectionHandler = handler;
      }
    }),
    to: vi.fn(() => ({ emit: ioRoomEmit })),
  };

  return {
    handlers,
    socket,
    server,
    socketRoomEmit,
    ioRoomEmit,
    get connectionHandler() {
      return connectionHandler;
    },
    reset() {
      Object.keys(handlers).forEach((key) => {
        delete handlers[key];
      });
      connectionHandler = null;
      socket.id = "socket-1";
      socket.on.mockClear();
      socket.join.mockClear();
      socket.leave.mockClear();
      socket.emit.mockClear();
      socket.to.mockClear();
      server.on.mockClear();
      server.to.mockClear();
      socketRoomEmit.mockClear();
      ioRoomEmit.mockClear();
    },
  };
});

const notificationService = vi.hoisted(() => ({
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
}));

const chatService = vi.hoisted(() => ({
  getChatRoomById: vi.fn(),
  sendMessage: vi.fn(),
  markMessageAsRead: vi.fn(),
}));

const messageRepo = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("socket.io", () => ({
  Server: vi.fn(function Server() {
    return state.server;
  }),
}));

vi.mock("jet-logger", () => ({
  default: {
    info: vi.fn(),
    err: vi.fn(),
  },
}));

vi.mock("../../src/services/NotificationService", () => ({
  NotificationService: notificationService,
}));

vi.mock("../../src/services/ChatService", () => ({
  ChatService: chatService,
}));

vi.mock("../../src/repos/MessageRepo", () => ({
  MessageRepo: messageRepo,
}));

vi.mock("../../src/config/socketRegistry", () => ({
  getIO: vi.fn(),
  setIO: vi.fn(),
  getUserRoom: vi.fn((userId: string) => `user:${userId}`),
}));

import { setupSocketIO } from "../../src/config/socket";

function connectSocket(socketId = "socket-1") {
  state.socket.id = socketId;
  setupSocketIO({} as never);
  expect(state.connectionHandler).toBeTypeOf("function");
  state.connectionHandler?.(state.socket);
}

describe("setupSocketIO 알림 이벤트 핸들러", () => {
  beforeEach(() => {
    state.reset();
    vi.clearAllMocks();
    notificationService.markAsRead.mockResolvedValue({});
    notificationService.markAllAsRead.mockResolvedValue({});
    notificationService.deleteNotification.mockResolvedValue(undefined);
  });

  it("notification:subscribe 이벤트로 사용자 알림 룸에 참여한다", () => {
    connectSocket();

    state.handlers["notification:subscribe"]({ userId: "user-1" });

    expect(state.socket.join).toHaveBeenCalledWith("user:user-1");
  });

  it("notification:subscribe payload가 잘못되면 socket:error를 발행한다", () => {
    connectSocket();

    state.handlers["notification:subscribe"]({ userId: "" });

    expect(state.socket.emit).toHaveBeenCalledWith(
      "socket:error",
      expect.objectContaining({
        message: "사용자 ID가 필요합니다.",
      })
    );
  });

  it("notification:read 이벤트를 NotificationService로 위임한다", async () => {
    connectSocket();

    await state.handlers["notification:read"]({
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(notificationService.markAsRead).toHaveBeenCalledWith(
      "notification-1",
      "user-1"
    );
  });

  it("notification:readAll 이벤트를 NotificationService로 위임한다", async () => {
    connectSocket();

    await state.handlers["notification:readAll"]({ userId: "user-1" });

    expect(notificationService.markAllAsRead).toHaveBeenCalledWith("user-1");
  });

  it("notification:delete 이벤트를 NotificationService로 위임한다", async () => {
    connectSocket();

    await state.handlers["notification:delete"]({
      notificationId: "notification-1",
      userId: "user-1",
    });

    expect(notificationService.deleteNotification).toHaveBeenCalledWith(
      "notification-1",
      "user-1"
    );
  });

  it("notification:delete payload가 잘못되면 service를 호출하지 않는다", async () => {
    connectSocket();

    await state.handlers["notification:delete"]({
      notificationId: "",
      userId: "user-1",
    });

    expect(notificationService.deleteNotification).not.toHaveBeenCalled();
    expect(state.socket.emit).toHaveBeenCalledWith(
      "socket:error",
      expect.objectContaining({
        message: "알림 ID와 사용자 ID가 필요합니다.",
      })
    );
  });
});

describe("setupSocketIO 채팅 이벤트 핸들러", () => {
  beforeEach(() => {
    state.reset();
    vi.clearAllMocks();
    chatService.getChatRoomById.mockResolvedValue({ id: "room-1" });
    chatService.sendMessage.mockResolvedValue({ id: "message-1" });
    chatService.markMessageAsRead.mockResolvedValue(undefined);
    messageRepo.findById.mockResolvedValue({
      id: "message-1",
      chatRoomId: "room-1",
      senderId: "user-1",
      content: "안녕하세요",
      messageType: "text",
      isRead: false,
      createdAt: new Date("2026-05-21T00:00:00.000Z"),
    });
  });

  it("chat:join 이벤트로 채팅방과 사용자 룸에 참여하고 입장 이벤트를 발행한다", async () => {
    connectSocket("chat-join-socket");

    await state.handlers["chat:join"]({
      chatRoomId: "room-1",
      userId: "user-1",
    });

    expect(chatService.getChatRoomById).toHaveBeenCalledWith("room-1");
    expect(state.socket.join).toHaveBeenCalledWith("room-1");
    expect(state.socket.join).toHaveBeenCalledWith("user:user-1");
    expect(state.socketRoomEmit).toHaveBeenCalledWith(
      "user_joined",
      expect.objectContaining({ chatRoomId: "room-1", userId: "user-1" })
    );
    expect(state.socketRoomEmit).toHaveBeenCalledWith(
      "chat:joined",
      expect.objectContaining({ chatRoomId: "room-1", userId: "user-1" })
    );
  });

  it("chat:send 이벤트로 메시지를 저장하고 기존/신규 메시지 이벤트를 모두 발행한다", async () => {
    connectSocket("chat-send-socket");
    await state.handlers["chat:join"]({
      chatRoomId: "room-1",
      userId: "user-1",
    });
    state.ioRoomEmit.mockClear();

    await state.handlers["chat:send"]({
      chatRoomId: "room-1",
      senderId: "user-1",
      content: "안녕하세요",
    });

    expect(chatService.sendMessage).toHaveBeenCalledWith({
      chatRoomId: "room-1",
      senderId: "user-1",
      content: "안녕하세요",
      messageType: "text",
    });
    expect(messageRepo.findById).toHaveBeenCalledWith("message-1");
    expect(state.server.to).toHaveBeenCalledWith("room-1");
    expect(state.ioRoomEmit).toHaveBeenCalledWith(
      "receive_message",
      expect.objectContaining({ id: "message-1", chatRoomId: "room-1" })
    );
    expect(state.ioRoomEmit).toHaveBeenCalledWith(
      "chat:message",
      expect.objectContaining({ id: "message-1", chatRoomId: "room-1" })
    );
    expect(state.ioRoomEmit).toHaveBeenCalledWith(
      "chat:roomUpdated",
      expect.objectContaining({
        id: "room-1",
        chatRoomId: "room-1",
        lastMessage: expect.objectContaining({
          id: "message-1",
          content: "안녕하세요",
          senderId: "user-1",
          messageType: "text",
        }),
      })
    );
  });

  it("chat:send 필수 payload가 없으면 메시지를 저장하지 않는다", async () => {
    connectSocket("chat-invalid-send-socket");

    await state.handlers["chat:send"]({
      chatRoomId: "room-1",
      senderId: "user-1",
      content: "",
    });

    expect(chatService.sendMessage).not.toHaveBeenCalled();
    expect(state.socket.emit).toHaveBeenCalledWith(
      "socket:error",
      expect.objectContaining({
        message: "필수 필드가 누락되었습니다.",
      })
    );
  });

  it("chat:send 메시지 타입이 지원 범위를 벗어나면 메시지를 저장하지 않는다", async () => {
    connectSocket("chat-invalid-message-type-socket");
    await state.handlers["chat:join"]({
      chatRoomId: "room-1",
      userId: "user-1",
    });

    await state.handlers["chat:send"]({
      chatRoomId: "room-1",
      senderId: "user-1",
      content: "파일 메시지",
      messageType: "file",
    });

    expect(chatService.sendMessage).not.toHaveBeenCalled();
    expect(state.socket.emit).toHaveBeenCalledWith(
      "socket:error",
      expect.objectContaining({
        message: "지원하지 않는 메시지 타입입니다.",
      })
    );
  });

  it("chat:read 이벤트로 읽음 처리 후 기존/신규 읽음 이벤트를 모두 발행한다", async () => {
    connectSocket("chat-read-socket");
    await state.handlers["chat:join"]({
      chatRoomId: "room-1",
      userId: "user-1",
    });
    state.socketRoomEmit.mockClear();

    await state.handlers["chat:read"]({
      messageId: "message-1",
      userId: "user-1",
    });

    expect(chatService.markMessageAsRead).toHaveBeenCalledWith(
      "message-1",
      "user-1"
    );
    expect(state.socketRoomEmit).toHaveBeenCalledWith("message_read", {
      messageId: "message-1",
      userId: "user-1",
    });
    expect(state.socketRoomEmit).toHaveBeenCalledWith("chat:read", {
      messageId: "message-1",
      userId: "user-1",
    });
  });

  it("chat:leave 이벤트로 채팅방을 나가고 기존/신규 퇴장 이벤트를 모두 발행한다", async () => {
    connectSocket("chat-leave-socket");
    await state.handlers["chat:join"]({
      chatRoomId: "room-1",
      userId: "user-1",
    });
    state.socketRoomEmit.mockClear();

    state.handlers["chat:leave"]({
      chatRoomId: "room-1",
      userId: "user-1",
    });

    expect(state.socket.leave).toHaveBeenCalledWith("room-1");
    expect(state.socketRoomEmit).toHaveBeenCalledWith(
      "user_left",
      expect.objectContaining({ chatRoomId: "room-1", userId: "user-1" })
    );
    expect(state.socketRoomEmit).toHaveBeenCalledWith(
      "chat:left",
      expect.objectContaining({ chatRoomId: "room-1", userId: "user-1" })
    );
  });
});
