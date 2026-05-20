import z from "zod";
import { MESSAGE_TYPES } from "../../../types/chat";

/**
 * 채팅방 생성 요청 스키마
 */
export const createChatRoomSchema = z.object({
  chatRoom: z.object({
    postId: z.string().uuid(),
  }),
});

export type CreateChatRoomReq = z.infer<typeof createChatRoomSchema>;

/**
 * 메시지 생성 요청 스키마
 */
export const createMessageSchema = z.object({
  message: z.object({
    chatRoomId: z.string().uuid(),
    senderId: z.string().uuid(),
    content: z.string().min(1),
    messageType: z.enum(MESSAGE_TYPES).optional().default("text"),
  }),
});

export type CreateMessageReq = z.infer<typeof createMessageSchema>;

/**
 * 메시지 수정 요청 스키마 (읽음 처리 등)
 */
export const updateMessageSchema = z.object({
  message: z.object({
    isRead: z.boolean().optional(),
  }),
});

export type UpdateMessageReq = z.infer<typeof updateMessageSchema>;
