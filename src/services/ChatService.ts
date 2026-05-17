// src/services/ChatService.ts

import { ChatRoomRepo } from "../repos/ChatRoomRepo";
import { MessageRepo } from "../repos/MessageRepo";
import { ChatRoomCreationAttributes } from "../models/ChatRoom";
import { MessageCreationAttributes } from "../models/Message";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import UserModel from "../models/User";
import { PostParticipantRepo } from "../repos/PostParticipantRepo";
import MessageModel from "../models/Message";
import { Op } from "sequelize";

export const ChatService = {
  /**
   * 채팅방 생성
   * - Post가 존재하는지 확인
   * - Post당 하나의 채팅방만 생성 가능
   */
  async createChatRoom(data: ChatRoomCreationAttributes) {
    const chatRoom = await ChatRoomRepo.create(data);
    return chatRoom;
  },

  /**
   * Post ID로 채팅방 조회 (없으면 생성)
   */
  async getOrCreateChatRoomByPostId(postId: string) {
    let chatRoom = await ChatRoomRepo.findByPostId(postId);

    if (!chatRoom) {
      // 채팅방이 없으면 생성
      chatRoom = await ChatRoomRepo.create({ postId });
    }

    return chatRoom;
  },

  /**
   * 채팅방 ID로 조회
   */
  async getChatRoomById(id: string) {
    const chatRoom = await ChatRoomRepo.findById(id);
    if (!chatRoom) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "CHAT_ROOM_NOT_FOUND");
    }
    return chatRoom;
  },

  /**
   * 메시지 전송
   * - 채팅방 존재 확인
   * - 발신자 존재 확인
   */
  async sendMessage(data: MessageCreationAttributes) {
    // 채팅방 존재 확인
    const chatRoom = await ChatRoomRepo.findById(data.chatRoomId);
    if (!chatRoom) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "CHAT_ROOM_NOT_FOUND");
    }

    // 발신자 존재 확인
    const sender = await UserModel.findByPk(data.senderId);
    if (!sender) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "SENDER_NOT_FOUND");
    }

    const message = await MessageRepo.create(data);
    return message;
  },

  /**
   * 채팅방의 메시지 목록 조회
   */
  async getMessagesByChatRoomId(chatRoomId: string, limit = 50, offset = 0) {
    // 채팅방 존재 확인
    const chatRoom = await ChatRoomRepo.findById(chatRoomId);
    if (!chatRoom) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "CHAT_ROOM_NOT_FOUND");
    }

    const messages = await MessageRepo.findByChatRoomId(
      chatRoomId,
      limit,
      offset
    );
    return messages;
  },

  /**
   * 메시지 읽음 처리
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const message = await MessageRepo.markAsRead(messageId, userId);
    return message;
  },

  /**
   * 채팅방의 모든 메시지 읽음 처리
   */
  async markAllMessagesAsRead(chatRoomId: string, userId: string) {
    // 채팅방 존재 확인
    const chatRoom = await ChatRoomRepo.findById(chatRoomId);
    if (!chatRoom) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "CHAT_ROOM_NOT_FOUND");
    }

    await MessageRepo.markAllAsRead(chatRoomId, userId);
  },

  /**
   * 읽지 않은 메시지 수 조회
   */
  async getUnreadMessageCount(chatRoomId: string, userId: string) {
    const count = await MessageRepo.countUnreadMessages(chatRoomId, userId);
    return count;
  },

  /**
   * 사용자가 접근 가능한 모든 채팅방의 읽지 않은 메시지 총합
   */
  async getUnreadMessageCountByUserId(userId: string) {
    const chatRoomIds = await ChatRoomRepo.findIdsByUserId(userId);
    return await MessageRepo.countUnreadMessagesByChatRoomIds(
      chatRoomIds,
      userId
    );
  },

  /**
   * 채팅방 삭제
   */
  async deleteChatRoom(id: string) {
    await ChatRoomRepo.delete(id);
  },

  /**
   * 메시지 삭제
   */
  async deleteMessage(id: string) {
    await MessageRepo.delete(id);
  },

  /**
   * 사용자가 참여한 채팅방 목록 조회
   * - 참여한 게시글의 채팅방 목록
   * - 각 채팅방의 참여자, 마지막 메시지, 읽지 않은 메시지 수 포함
   */
  async getChatRoomsByUserId(userId: string, limit = 20, offset = 0) {
    // 사용자 존재 확인
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    // 사용자가 참여한 게시글의 채팅방 목록 조회
    const chatRooms = await ChatRoomRepo.findByUserId(userId, limit, offset);

    // 각 채팅방에 대한 추가 정보 조회
    const enrichedChatRooms = (
      await Promise.all(
        chatRooms.map(async (chatRoom) => {
          const postId = chatRoom.postId;

          // 참여자 목록 조회 (주최자 + 참여자)
          const participants = await PostParticipantRepo.findByPostId(postId);

          // Post 정보 조회 (images 포함)
          const PostModel = (await import("../models/Post")).default;
          const PostImageModel = (await import("../models/PostImage")).default;
          const post = await PostModel.findByPk(postId, {
            include: [
              {
                model: PostImageModel,
                as: "images",
                attributes: ["id", "imageUrl", "sortOrder"],
                order: [["sortOrder", "ASC"]],
              },
            ],
          });

          if (!post) {
            // Post가 없으면 스킵
            return null;
          }

          const postData = post.get() as any;
          const postImages = (post as any).images || [];

          // 주최자 정보 추가
          const author = await UserModel.findByPk(postData.authorId, {
            attributes: ["id", "nickname", "avatarUrl"],
          });

          const participantList = [
            ...(author
              ? [
                  {
                    userId: author.id,
                    nickname: author.nickname,
                    avatarUrl: author.avatarUrl,
                  },
                ]
              : []),
            ...participants.map((p: any) => ({
              userId: p.user?.id || p.userId,
              nickname: p.user?.nickname || "",
              avatarUrl: p.user?.avatarUrl || null,
            })),
          ];

          // 마지막 메시지 조회
          const lastMessage = await MessageModel.findOne({
            where: { chatRoomId: chatRoom.id },
            order: [["createdAt", "DESC"]],
            include: [
              {
                model: UserModel,
                as: "sender",
                attributes: ["id", "nickname"],
              },
            ],
          });

          // 읽지 않은 메시지 수 조회
          const unreadCount = await MessageRepo.countUnreadMessages(
            chatRoom.id,
            userId
          );

          return {
            id: chatRoom.id,
            postId: chatRoom.postId,
            post: {
              id: postData.id,
              title: postData.title,
              authorId: postData.authorId,
              images: postImages.map((img: any) => img.imageUrl),
            },
            participants: participantList,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  senderId: lastMessage.senderId,
                  createdAt: lastMessage.createdAt,
                }
              : null,
            unreadCount,
            createdAt: chatRoom.createdAt,
            updatedAt: chatRoom.updatedAt,
          };
        })
      )
    ).filter((room) => room !== null);

    // 전체 개수 조회 (참여한 게시글 + 작성한 게시글)
    const totalParticipants = await PostParticipantRepo.findByUserId(userId);
    const participantPostIds = totalParticipants.map((p) => p.postId);

    const PostModel = (await import("../models/Post")).default;
    const authoredPosts = await PostModel.findAll({
      where: { authorId: userId },
      attributes: ["id"],
    });
    const authoredPostIds = authoredPosts.map((p) => p.id);

    const allPostIds = [
      ...new Set([...participantPostIds, ...authoredPostIds]),
    ];
    const total =
      allPostIds.length > 0
        ? await (
            await import("../models/ChatRoom")
          ).default.count({
            where: { postId: allPostIds },
          })
        : 0;

    return {
      chatRooms: enrichedChatRooms,
      total,
      limit,
      offset,
    };
  },
};
