// src/services/TrustService.ts

import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import { sequelize } from "../db";
import TrustEventModel, {
  TrustEventType,
} from "../models/TrustEvent";
import UserModel from "../models/User";
import { TrustEventRepo } from "../repos/TrustEventRepo";

export const TRUST_POLICY = {
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  DEFAULT_SCORE: 50,
  MIN_GRADE: 2.5,
  MAX_GRADE: 4.5,
  DEFAULT_GRADE: 3.5,
  AUTHOR_COMPLETED: 10,
  PARTICIPANT_COMPLETED: 5,
  AUTHOR_CANCELLED: -5,
  AUTHOR_DELETED_POST: -5,
  PARTICIPANT_CANCELLED: -3,
  PARTICIPANT_NO_SHOW: -10,
} as const;

type TrustEventMetadata = Record<string, unknown>;

interface ApplyTrustEventInput {
  userId: string;
  type: TrustEventType;
  scoreChange: number;
  postId?: string | null;
  actorUserId?: string | null;
  reason?: string | null;
  metadata?: TrustEventMetadata | null;
}

const clampTrustScore = (score: number) =>
  Math.max(TRUST_POLICY.MIN_SCORE, Math.min(TRUST_POLICY.MAX_SCORE, score));

type UserWithTrustScore = {
  trustScore: number;
};

export const TrustService = {
  calculateTrustGrade(trustScore: number) {
    const clampedScore = clampTrustScore(trustScore);
    const gradeRange = TRUST_POLICY.MAX_GRADE - TRUST_POLICY.MIN_GRADE;
    const scoreRange = TRUST_POLICY.MAX_SCORE - TRUST_POLICY.MIN_SCORE;
    const grade =
      TRUST_POLICY.MIN_GRADE +
      ((clampedScore - TRUST_POLICY.MIN_SCORE) / scoreRange) * gradeRange;

    return Number(grade.toFixed(1));
  },

  withTrustGrade<T extends UserWithTrustScore>(user: T) {
    return {
      ...user,
      trustGrade: this.calculateTrustGrade(user.trustScore),
    };
  },

  async applyEvent(input: ApplyTrustEventInput) {
    return await sequelize.transaction(async (transaction) => {
      const user = await UserModel.findByPk(input.userId, { transaction });
      if (!user) {
        throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
      }

      const previousScore = user.trustScore;
      const nextScore = clampTrustScore(previousScore + input.scoreChange);

      await user.update({ trustScore: nextScore }, { transaction });

      const event = await TrustEventModel.create(
        {
          userId: input.userId,
          postId: input.postId ?? null,
          actorUserId: input.actorUserId ?? null,
          type: input.type,
          scoreChange: input.scoreChange,
          previousScore,
          nextScore,
          reason: input.reason ?? null,
          metadata: input.metadata ?? null,
        },
        { transaction }
      );

      return event.get();
    });
  },

  async listEventsByUserId(userId: string, limit = 20, offset = 0) {
    const user = await UserModel.findByPk(userId, {
      attributes: ["id"],
    });
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    const events = await TrustEventRepo.findByUserId(userId, limit, offset);
    const total = await TrustEventRepo.countByUserId(userId);

    return {
      trustEvents: events.map((event) => ({
        ...event,
        previousGrade: this.calculateTrustGrade(event.previousScore),
        nextGrade: this.calculateTrustGrade(event.nextScore),
      })),
      total,
      limit,
      offset,
    };
  },

  async recordPostCompletedForAuthor(postId: string, authorId: string) {
    return await this.applyEvent({
      userId: authorId,
      postId,
      actorUserId: authorId,
      type: "post_completed_author",
      scoreChange: TRUST_POLICY.AUTHOR_COMPLETED,
      reason: "공동구매 거래 완료: 작성자 보상",
    });
  },

  async recordPostCompletedForParticipant(
    postId: string,
    participantUserId: string
  ) {
    return await this.applyEvent({
      userId: participantUserId,
      postId,
      type: "post_completed_participant",
      scoreChange: TRUST_POLICY.PARTICIPANT_COMPLETED,
      reason: "공동구매 거래 완료: 참여자 보상",
    });
  },

  async recordPostCancelledByAuthor(postId: string, authorId: string) {
    return await this.applyEvent({
      userId: authorId,
      postId,
      actorUserId: authorId,
      type: "post_cancelled_by_author",
      scoreChange: TRUST_POLICY.AUTHOR_CANCELLED,
      reason: "공동구매 취소: 작성자 감점",
    });
  },

  async recordPostDeletedByAuthor(postId: string, authorId: string) {
    return await this.applyEvent({
      userId: authorId,
      postId,
      actorUserId: authorId,
      type: "post_deleted_by_author",
      scoreChange: TRUST_POLICY.AUTHOR_DELETED_POST,
      reason: "공동구매 게시글 삭제: 작성자 감점",
    });
  },

  async recordParticipantCancelled(postId: string, participantUserId: string) {
    return await this.applyEvent({
      userId: participantUserId,
      postId,
      actorUserId: participantUserId,
      type: "participant_cancelled",
      scoreChange: TRUST_POLICY.PARTICIPANT_CANCELLED,
      reason: "공동구매 참여 취소: 참여자 감점",
    });
  },

  async recordAgreementConfirmed(postId: string, participantUserId: string) {
    return await this.applyEvent({
      userId: participantUserId,
      postId,
      actorUserId: participantUserId,
      type: "agreement_confirmed",
      scoreChange: 0,
      reason: "공동구매 사전 약속 확인",
    });
  },
};
