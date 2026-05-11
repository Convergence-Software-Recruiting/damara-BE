// src/repos/PostParticipantRepo.ts

import PostParticipantModel, {
  PostParticipantCreationAttributes,
} from "../models/PostParticipant";
import PostModel from "../models/Post";
import UserModel from "../models/User";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";

export const PostParticipantRepo = {
  /**
   * 공동구매 참여
   * - 중복 참여 방지 (unique 제약)
   */
  async create(data: PostParticipantCreationAttributes) {
    try {
      // Post 존재 확인
      const post = await PostModel.findByPk(data.postId);
      if (!post) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
      }

      // User 존재 확인
      const user = await UserModel.findByPk(data.userId);
      if (!user) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
      }

      // 작성자는 참여할 수 없음
      if (post.authorId === data.userId) {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "AUTHOR_CANNOT_JOIN");
      }

      // 이미 마감되었거나 취소된 게시글은 참여 불가
      if (post.status !== "open") {
        throw new RouteError(HttpStatusCodes.BAD_REQUEST, "POST_NOT_OPEN");
      }

      const participant = await PostParticipantModel.create(data);
      return participant.get();
    } catch (e: unknown) {
      // 이미 참여한 경우
      if (e instanceof Error && e.name === "SequelizeUniqueConstraintError") {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          "ALREADY_PARTICIPATED"
        );
      }
      throw e;
    }
  },

  /**
   * 참여 취소
   */
  async delete(postId: string, userId: string) {
    const participant = await PostParticipantModel.findOne({
      where: { postId, userId },
    });

    if (!participant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "PARTICIPANT_NOT_FOUND");
    }

    const deletedParticipant = participant.get();
    await participant.destroy();

    return deletedParticipant;
  },

  /**
   * 게시글의 참여자 목록 조회
   */
  async findByPostId(postId: string) {
    const participants = await PostParticipantModel.findAll({
      where: { postId },
      include: [
        {
          model: UserModel,
          as: "user",
          attributes: ["id", "nickname", "studentId", "avatarUrl"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return participants.map((p) => p.get());
  },

  /**
   * 게시글의 약속 확인 완료 참여자 목록 조회
   */
  async findAcceptedByPostId(postId: string) {
    const participants = await PostParticipantModel.findAll({
      where: { postId, agreementStatus: "accepted" },
      order: [["createdAt", "ASC"]],
    });

    return participants.map((p) => p.get());
  },

  /**
   * 사용자가 참여한 게시글 목록 조회
   */
  async findByUserId(userId: string) {
    const participants = await PostParticipantModel.findAll({
      where: { userId },
      include: [
        {
          model: PostModel,
          as: "post",
          attributes: [
            "id",
            "title",
            "price",
            "minParticipants",
            "status",
            "deadline",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return participants.map((p) => p.get());
  },

  /**
   * 게시글의 참여자 수 조회
   */
  async countByPostId(postId: string) {
    return await PostParticipantModel.count({
      where: { postId },
    });
  },

  /**
   * 약속 확인을 완료한 참여자 수 조회
   */
  async countAcceptedByPostId(postId: string) {
    return await PostParticipantModel.count({
      where: { postId, agreementStatus: "accepted" },
    });
  },

  /**
   * 사용자가 특정 게시글에 참여했는지 확인
   */
  async isParticipant(postId: string, userId: string) {
    const participant = await PostParticipantModel.findOne({
      where: { postId, userId },
    });
    return participant !== null;
  },

  /**
   * 참여자의 사전 약속 확인 처리
   */
  async acceptAgreement(postId: string, userId: string) {
    const participant = await PostParticipantModel.findOne({
      where: { postId, userId },
    });

    if (!participant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "PARTICIPANT_NOT_FOUND");
    }

    if (participant.agreementStatus === "accepted") {
      return {
        participant: participant.get(),
        changed: false,
      };
    }

    await participant.update({
      agreementStatus: "accepted",
      agreementAcceptedAt: new Date(),
    });

    return {
      participant: participant.get(),
      changed: true,
    };
  },
};
