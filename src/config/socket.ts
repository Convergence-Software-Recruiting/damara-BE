// src/config/socket.ts

import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import logger from "jet-logger";
import { ChatService } from "../services/ChatService";
import { MessageCreationAttributes } from "../models/Message";
import { MessageRepo } from "../repos/MessageRepo";
import { MessageType } from "../types/chat";
import {
  getIO as getRegisteredIO,
  getUserRoom,
  setIO as setRegisteredIO,
} from "./socketRegistry";

/**
 * Socket.io 서버 설정
 * - 실시간 채팅 기능을 위한 WebSocket 서버
 * - 채팅방별로 룸(Room)을 생성하여 메시지 브로드캐스트
 */

// 클라이언트 연결 정보를 저장하는 맵
// key: socket.id, value: { userId, chatRoomId }
const connectedClients = new Map<
  string,
  { userId: string; chatRoomId: string }
>();

type JoinChatRoomPayload = {
  chatRoomId: string;
  userId: string;
};

type SendMessagePayload = {
  chatRoomId: string;
  senderId: string;
  content: string;
  messageType?: MessageType;
};

type ReadMessagePayload = {
  messageId: string;
  userId: string;
};

function emitSocketError(socket: Socket, message: string, error?: unknown) {
  const payload = {
    message,
    error: error instanceof Error ? error.message : String(error ?? ""),
  };

  socket.emit("error", payload);
  socket.emit("socket:error", payload);
}

/**
 * Socket.io 서버 초기화
 */
export function setupSocketIO(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*", // 프로덕션에서는 특정 도메인으로 제한해야 함
      methods: ["GET", "POST"],
      credentials: true,
    },
    // 연결 옵션
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`✓ 클라이언트 연결: ${socket.id}`);

    /**
     * 채팅방 입장
     * 클라이언트가 특정 채팅방에 참여할 때 호출
     */
    const handleJoinChatRoom = async (data: JoinChatRoomPayload) => {
      try {
        const { chatRoomId, userId } = data;

        // 채팅방 존재 확인
        await ChatService.getChatRoomById(chatRoomId);

        // Socket.io 룸에 참여
        socket.join(chatRoomId);
        socket.join(getUserRoom(userId));

        // 연결 정보 저장
        connectedClients.set(socket.id, { userId, chatRoomId });

        logger.info(`✓ 사용자 ${userId}가 채팅방 ${chatRoomId}에 입장했습니다.`);

        const joinedPayload = {
          userId,
          chatRoomId,
          message: "사용자가 채팅방에 입장했습니다.",
        };

        // 입장 알림을 해당 채팅방의 다른 사용자들에게 전송
        socket.to(chatRoomId).emit("user_joined", joinedPayload);
        socket.to(chatRoomId).emit("chat:joined", joinedPayload);
      } catch (error) {
        logger.err(`✗ 채팅방 입장 실패: ${socket.id}`);
        emitSocketError(socket, "채팅방 입장에 실패했습니다.", error);
      }
    };

    socket.on("join_chat_room", handleJoinChatRoom);
    socket.on("chat:join", handleJoinChatRoom);

    /**
     * 알림 수신 룸 구독
     */
    socket.on("notification:subscribe", (data: { userId: string }) => {
      if (!data.userId) {
        emitSocketError(socket, "사용자 ID가 필요합니다.");
        return;
      }

      socket.join(getUserRoom(data.userId));
      logger.info(`✓ 사용자 ${data.userId}가 알림 룸에 연결되었습니다.`);
    });

    /**
     * 메시지 전송
     * 클라이언트가 메시지를 보낼 때 호출
     */
    const handleSendMessage = async (data: SendMessagePayload) => {
      try {
        const { chatRoomId, senderId, content, messageType = "text" } = data;

        // 메시지 데이터 검증
        if (!chatRoomId || !senderId || !content) {
          emitSocketError(socket, "필수 필드가 누락되었습니다.");
          return;
        }

        // 채팅방에 참여했는지 확인
        const clientInfo = connectedClients.get(socket.id);
        if (!clientInfo || clientInfo.chatRoomId !== chatRoomId) {
          emitSocketError(socket, "먼저 채팅방에 입장해주세요.");
          return;
        }

        // DB에 메시지 저장
        const messageData: MessageCreationAttributes = {
          chatRoomId,
          senderId,
          content,
          messageType,
        };

        const savedMessage = await ChatService.sendMessage(messageData);

        // 발신자 정보를 포함하여 메시지 조회 (저장된 메시지의 ID로 직접 조회)
        const fullMessage = await MessageRepo.findById(savedMessage.id);

        if (!fullMessage) {
          logger.err(`✗ 메시지 조회 실패: 저장된 메시지를 찾을 수 없습니다.`);
          emitSocketError(socket, "메시지 전송 후 조회에 실패했습니다.");
          return;
        }

        // chatRoomId가 명시적으로 포함되도록 보장
        const messageToBroadcast = {
          ...fullMessage,
          chatRoomId: chatRoomId, // 명시적으로 chatRoomId 포함
        };

        // 해당 채팅방의 모든 사용자에게 메시지 브로드캐스트 (발신자 포함)
        io.to(chatRoomId).emit("receive_message", messageToBroadcast);
        io.to(chatRoomId).emit("chat:message", messageToBroadcast);

        logger.info(
          `✓ 메시지 브로드캐스트 완료: ${chatRoomId} - ${senderId} - ${fullMessage.id}`
        );

        logger.info(`✓ 메시지 전송 성공: ${chatRoomId} - ${senderId}`);
      } catch (error) {
        logger.err(`✗ 메시지 전송 실패: ${socket.id}`);
        logger.err(error, true);
        emitSocketError(socket, "메시지 전송에 실패했습니다.", error);
      }
    };

    socket.on("send_message", handleSendMessage);
    socket.on("chat:send", handleSendMessage);

    /**
     * 메시지 읽음 처리
     */
    const handleMarkMessageRead = async (data: ReadMessagePayload) => {
      try {
        const { messageId, userId } = data;
        await ChatService.markMessageAsRead(messageId, userId);

        // 읽음 처리 알림을 해당 채팅방에 브로드캐스트
        const clientInfo = connectedClients.get(socket.id);
        if (clientInfo) {
          const readPayload = {
            messageId,
            userId,
          };
          socket.to(clientInfo.chatRoomId).emit("message_read", readPayload);
          socket.to(clientInfo.chatRoomId).emit("chat:read", readPayload);
        }
      } catch (error) {
        logger.err(`✗ 메시지 읽음 처리 실패: ${socket.id}`);
        emitSocketError(socket, "메시지 읽음 처리에 실패했습니다.", error);
      }
    };

    socket.on("mark_message_read", handleMarkMessageRead);
    socket.on("chat:read", handleMarkMessageRead);

    /**
     * 채팅방 나가기
     */
    const handleLeaveChatRoom = (data: JoinChatRoomPayload) => {
      const { chatRoomId, userId } = data;
      socket.leave(chatRoomId);

      const leftPayload = {
        userId,
        chatRoomId,
        message: "사용자가 채팅방을 나갔습니다.",
      };

      // 나가기 알림
      socket.to(chatRoomId).emit("user_left", leftPayload);
      socket.to(chatRoomId).emit("chat:left", leftPayload);

      // 연결 정보 삭제
      connectedClients.delete(socket.id);

      logger.info(`✓ 사용자 ${userId}가 채팅방 ${chatRoomId}에서 나갔습니다.`);
    };

    socket.on("leave_chat_room", handleLeaveChatRoom);
    socket.on("chat:leave", handleLeaveChatRoom);

    /**
     * 연결 해제 처리
     */
    socket.on("disconnect", () => {
      const clientInfo = connectedClients.get(socket.id);
      if (clientInfo) {
        const { chatRoomId, userId } = clientInfo;
        const leftPayload = {
          userId,
          chatRoomId,
          message: "사용자가 채팅방을 나갔습니다.",
        };
        socket.to(chatRoomId).emit("user_left", leftPayload);
        socket.to(chatRoomId).emit("chat:left", leftPayload);
        connectedClients.delete(socket.id);
      }
      logger.info(`✗ 클라이언트 연결 해제: ${socket.id}`);
    });

    /**
     * 연결 오류 처리
     */
    socket.on("error", (error: unknown) => {
      logger.err(`✗ Socket 오류: ${socket.id}`);
      logger.err(error, true);
    });
  });

  logger.info("✓ Socket.io 서버 초기화 완료");

  return io;
}

export function getIO(): SocketServer | null {
  return getRegisteredIO();
}

export function setIO(io: SocketServer): void {
  setRegisteredIO(io);
}
