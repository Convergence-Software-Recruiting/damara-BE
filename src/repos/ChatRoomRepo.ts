// src/repos/ChatRoomRepo.ts

import ChatRoomModel, { ChatRoomCreationAttributes } from "../models/ChatRoom";
import PostModel from "../models/Post";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";

export const ChatRoomRepo = {
  /**
   * 채팅방 생성
   * - Post가 존재하는지 확인
   * - Post당 하나의 채팅방만 생성 가능 (unique 제약)
   */
  async create(data: ChatRoomCreationAttributes) {
    try {
      // Post 존재 확인
      const post = await PostModel.findByPk(data.postId);
      if (!post) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
      }

      const chatRoom = await ChatRoomModel.create(data);
      return chatRoom.get();
    } catch (e: unknown) {
      // 이미 채팅방이 존재하는 경우
      if (e instanceof Error && e.name === "SequelizeUniqueConstraintError") {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          "CHAT_ROOM_ALREADY_EXISTS"
        );
      }
      throw e;
    }
  }
  /**
   * ID로 채팅방 조회
   */,
  async findById(id: string) {
    const chatRoom = await ChatRoomModel.findByPk(id, {
      include: [
        {
          model: PostModel,
          as: "post",
          attributes: ["id", "title", "authorId"],
        },
      ],
    });
    return chatRoom ? chatRoom.get() : null;
  },

  /**
   * Post ID로 채팅방 조회
   */
  async findByPostId(postId: string) {
    const chatRoom = await ChatRoomModel.findOne({
      where: { postId },
      include: [
        {
          model: PostModel,
          as: "post",
          attributes: ["id", "title", "authorId"],
        },
      ],
    });
    return chatRoom ? chatRoom.get() : null;
  },

  /**
   * 채팅방 삭제
   */
  async delete(id: string) {
    const deleted = await ChatRoomModel.destroy({ where: { id } });
    if (deleted === 0) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "CHAT_ROOM_NOT_FOUND");
    }
  },

  /**
   * 사용자가 참여한 게시글의 채팅방 목록 조회
   * - PostParticipant를 통해 사용자가 참여한 게시글 찾기
   * - 작성자가 작성한 게시글의 채팅방도 포함
   * - 각 게시글의 채팅방 찾기
   */
  async findByUserId(userId: string, limit = 20, offset = 0) {
    const { PostParticipantRepo } = await import("./PostParticipantRepo");

    // 사용자가 참여한 게시글 목록 조회
    const participants = await PostParticipantRepo.findByUserId(userId);
    const participantPostIds = participants.map((p) => p.postId);

    // 작성자가 작성한 게시글 목록 조회
    const authoredPosts = await PostModel.findAll({
      where: { authorId: userId },
      attributes: ["id"],
    });
    const authoredPostIds = authoredPosts.map((p) => p.id);

    // 참여한 게시글 + 작성한 게시글 합치기 (중복 제거)
    const allPostIds = [
      ...new Set([...participantPostIds, ...authoredPostIds]),
    ];

    if (allPostIds.length === 0) {
      return [];
    }

    // 각 게시글의 채팅방 조회
    const chatRooms = await ChatRoomModel.findAll({
      where: {
        postId: allPostIds,
      },
      include: [
        {
          model: PostModel,
          as: "post",
          attributes: ["id", "title", "authorId"],
          include: [
            {
              model: (await import("../models/PostImage")).default,
              as: "images",
              attributes: ["id", "imageUrl", "sortOrder"],
              order: [["sortOrder", "ASC"]],
            },
          ],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    });

    return chatRooms.map((cr) => cr.get());
  },

  /**
   * 사용자가 접근할 수 있는 채팅방 ID 목록 조회
   * - 사용자가 작성했거나 참여한 게시글의 채팅방만 포함
   */
  async findIdsByUserId(userId: string) {
    const { PostParticipantRepo } = await import("./PostParticipantRepo");

    const participants = await PostParticipantRepo.findByUserId(userId);
    const participantPostIds = participants.map((p) => p.postId);

    const authoredPosts = await PostModel.findAll({
      where: { authorId: userId },
      attributes: ["id"],
    });
    const authoredPostIds = authoredPosts.map((p) => p.id);

    const postIds = [...new Set([...participantPostIds, ...authoredPostIds])];
    if (postIds.length === 0) {
      return [];
    }

    const chatRooms = await ChatRoomModel.findAll({
      where: {
        postId: postIds,
      },
      attributes: ["id"],
    });

    return chatRooms.map((chatRoom) => chatRoom.id);
  },
};
