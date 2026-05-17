// src/repos/MessageRepo.ts

import MessageModel, { MessageCreationAttributes } from "../models/Message";
import UserModel from "../models/User";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { Op } from "sequelize";

export const MessageRepo = {
  /**
   * 메시지 생성
   */
  async create(data: MessageCreationAttributes) {
    try {
      const message = await MessageModel.create(data);
      return message.get();
    } catch (e: unknown) {
      throw e;
    }
  },

  /**
   * ID로 메시지 조회
   */
  async findById(id: string) {
    const message = await MessageModel.findByPk(id, {
      include: [
        {
          model: UserModel,
          as: "sender",
          attributes: ["id", "nickname", "avatarUrl", "studentId"],
        },
      ],
    });
    return message ? message.get() : null;
  },

  /**
   * 채팅방의 모든 메시지 조회 (페이징)
   */
  async findByChatRoomId(chatRoomId: string, limit = 50, offset = 0) {
    const messages = await MessageModel.findAll({
      where: { chatRoomId },
      include: [
        {
          model: UserModel,
          as: "sender",
          attributes: ["id", "nickname", "avatarUrl", "studentId"],
        },
      ],
      order: [["createdAt", "ASC"]], // 오래된 순서대로
      limit,
      offset,
    });

    return messages.map((m) => m.get());
  },

  /**
   * 특정 사용자의 읽지 않은 메시지 수 조회
   */
  async countUnreadMessages(chatRoomId: string, userId: string) {
    const count = await MessageModel.count({
      where: {
        chatRoomId,
        senderId: { [Op.ne]: userId }, // 본인이 보낸 메시지 제외
        isRead: false,
      },
    });
    return count;
  },

  /**
   * 여러 채팅방에서 특정 사용자가 읽지 않은 메시지 수 조회
   */
  async countUnreadMessagesByChatRoomIds(chatRoomIds: string[], userId: string) {
    if (chatRoomIds.length === 0) {
      return 0;
    }

    return await MessageModel.count({
      where: {
        chatRoomId: {
          [Op.in]: chatRoomIds,
        },
        senderId: { [Op.ne]: userId },
        isRead: false,
      },
    });
  },

  /**
   * 메시지 읽음 처리
   */
  async markAsRead(messageId: string, userId: string) {
    const message = await MessageModel.findByPk(messageId);
    if (!message) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "MESSAGE_NOT_FOUND");
    }

    // 본인이 보낸 메시지는 읽음 처리 불가
    if (message.senderId === userId) {
      return message.get();
    }

    await message.update({ isRead: true });
    return message.get();
  },

  /**
   * 채팅방의 모든 메시지 읽음 처리
   */
  async markAllAsRead(chatRoomId: string, userId: string) {
    await MessageModel.update(
      { isRead: true },
      {
        where: {
          chatRoomId,
          senderId: { [Op.ne]: userId }, // 본인이 보낸 메시지 제외
          isRead: false,
        },
      }
    );
  },

  /**
   * 메시지 삭제
   */
  async delete(id: string) {
    const deleted = await MessageModel.destroy({ where: { id } });
    if (deleted === 0) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "MESSAGE_NOT_FOUND");
    }
  },
};
