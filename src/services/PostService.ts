// src/services/PostService.ts

import { PostRepo } from "../repos/PostRepo";
import { PostCreationAttributes } from "../models/Post";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import UserModel from "../models/User";
import { UserService } from "./UserService";
import { PostParticipantRepo } from "../repos/PostParticipantRepo";
import PostModel from "../models/Post";
import { FavoriteService } from "./FavoriteService";
import { NotificationService } from "./NotificationService";

export const PostService = {
  /**
   * 공동구매 상품 등록
   * - 작성자가 존재하는지 확인
   * - 이미지 URL 배열을 PostRepo로 전달
   */
  async createPost(data: PostCreationAttributes, imageUrls: string[] = []) {
    // 작성자 존재 확인
    const author = await UserModel.findByPk(data.authorId);
    if (!author) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "AUTHOR_NOT_FOUND");
    }

    const post = await PostRepo.create(data, imageUrls);
    return post?.get();
  },

  /**
   * ID로 상품 조회
   * - favoriteCount와 isFavorite 포함
   */
  async getPostById(id: string, userId?: string) {
    const post = await PostRepo.findById(id);
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    // 관심 수 조회
    const favoriteCount = await FavoriteService.getFavoriteCount(id);

    // 관심 여부 확인 (userId가 제공된 경우)
    let isFavorite = false;
    if (userId) {
      isFavorite = await FavoriteService.isFavorite(id, userId);
    }

    return {
      ...post,
      favoriteCount,
      isFavorite,
    };
  },

  /**
   * 전체 조회 + pagination
   * category 필터링 지원
   */
  async listPosts(limit = 20, offset = 0, category?: string | null) {
    return await PostRepo.list(limit, offset, category);
  },

  /**
   * 작성자 ID로 조회
   */
  async listPostsByAuthor(authorId: string, limit = 20, offset = 0) {
    return await PostRepo.findByAuthorId(authorId, limit, offset);
  },

  /**
   * 작성자 학번으로 조회
   * - 학번으로 User를 찾은 뒤 해당 사용자의 게시글을 반환
   */
  async listPostsByStudentId(studentId: string, limit = 20, offset = 0) {
    const author = await UserModel.findOne({ where: { studentId } });
    if (!author) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "AUTHOR_NOT_FOUND");
    }
    return await PostRepo.findByAuthorId(author.id, limit, offset);
  },

  /**
   * 게시글 상태 변경
   * - 작성자만 변경 가능
   * - 상태 전이 규칙 적용 (선택사항)
   * - 상태 변경 시 신뢰점수 업데이트
   */
  async updatePostStatus(
    id: string,
    newStatus: "open" | "closed" | "in_progress" | "completed" | "cancelled",
    authorId: string
  ) {
    const post = await PostRepo.findById(id);
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    // 작성자 권한 체크
    if (post.authorId !== authorId) {
      throw new RouteError(
        HttpStatusCodes.FORBIDDEN,
        "작성자만 상태를 변경할 수 있습니다."
      );
    }

    // 상태 전이 규칙 적용 (선택사항)
    // 주석 처리하면 모든 상태 간 자유롭게 변경 가능
    const ENABLE_STATUS_TRANSITION_RULES = true; // false로 변경하면 규칙 비활성화

    if (ENABLE_STATUS_TRANSITION_RULES) {
      const validTransitions: Record<string, string[]> = {
        open: ["closed", "cancelled"],
        closed: ["in_progress", "cancelled"],
        in_progress: ["completed", "cancelled"],
        completed: [], // 변경 불가
        cancelled: [], // 변경 불가
      };

      const currentStatus = post.status;
      const allowedStatuses = validTransitions[currentStatus] || [];

      // completed나 cancelled 상태에서는 변경 불가
      if (currentStatus === "completed" || currentStatus === "cancelled") {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          `${currentStatus} 상태에서는 상태를 변경할 수 없습니다.`
        );
      }

      // 상태 전이 규칙 체크
      if (allowedStatuses.length > 0 && !allowedStatuses.includes(newStatus)) {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          `${currentStatus} 상태에서 ${newStatus} 상태로 변경할 수 없습니다. 가능한 상태: ${allowedStatuses.join(
            ", "
          )}`
        );
      }
    }

    // 상태 업데이트
    await PostRepo.update(id, { status: newStatus });

    // 업데이트 후 최신 데이터 조회 (관계 데이터 포함)
    const newPost = await PostRepo.findById(id);
    if (!newPost) {
      throw new RouteError(
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        "게시글 업데이트 후 조회에 실패했습니다."
      );
    }

    // 상태 변경 시 신뢰점수 업데이트 (기존 로직 재사용)
    if (newStatus === "closed") {
      // 공동구매 완료: 주최자 +10점, 참여자 +5점
      try {
        await UserService.updateTrustScore(post.authorId, 10);
      } catch (error) {
        console.error("Failed to update trust score for author:", error);
      }

      const participants = await PostParticipantRepo.findByPostId(id);
      const participantUserIds: string[] = [];

      for (const participant of participants) {
        try {
          await UserService.updateTrustScore(participant.userId, 5);
          participantUserIds.push(participant.userId);
        } catch (error) {
          console.error(
            `Failed to update trust score for participant ${participant.userId}:`,
            error
          );
        }
      }

      // 공동구매 완료 알림 생성 (주최자 + 참여자)
      try {
        const allUserIds = [post.authorId, ...participantUserIds];
        await NotificationService.createPostCompletedNotification(
          id,
          allUserIds
        );
      } catch (error) {
        console.error("Failed to create completion notification:", error);
      }
    } else if (newStatus === "cancelled") {
      // 공동구매 취소: 주최자 -5점
      try {
        await UserService.updateTrustScore(post.authorId, -5);
      } catch (error) {
        console.error("Failed to update trust score for author:", error);
      }

      // 공동구매 취소 알림 생성 (참여자 + 관심 등록자)
      try {
        const participants = await PostParticipantRepo.findByPostId(id);
        const participantUserIds = participants.map((p) => p.userId);

        // 관심 등록자 목록 가져오기
        const { FavoriteRepo } = await import("../repos/FavoriteRepo");
        const favorites = await FavoriteRepo.findByPostId(id);
        const favoriteUserIds = favorites.map((f) => f.userId);

        // 중복 제거
        const allUserIds = [
          ...new Set([...participantUserIds, ...favoriteUserIds]),
        ];

        if (allUserIds.length > 0) {
          await NotificationService.createPostCancelledNotification(
            id,
            allUserIds
          );
        }
      } catch (error) {
        console.error("Failed to create cancellation notification:", error);
      }
    }

    return newPost;
  },

  /**
   * 부분 업데이트
   * - status가 closed 또는 cancelled로 변경될 때 신뢰점수 업데이트
   */
  async updatePost(id: string, patch: Partial<PostCreationAttributes>) {
    // 이전 상태 확인
    const oldPost = await PostRepo.findById(id);
    if (!oldPost) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    const updatedPost = await PostRepo.update(id, patch);
    const newPost = updatedPost?.get();

    // status 변경 시 신뢰점수 업데이트
    if (patch.status && oldPost.status !== patch.status) {
      if (patch.status === "closed") {
        // 공동구매 완료: 주최자 +10점, 참여자 +5점
        try {
          await UserService.updateTrustScore(oldPost.authorId, 10);
        } catch (error) {
          // 신뢰점수 업데이트 실패해도 게시글 업데이트는 성공으로 처리
          console.error("Failed to update trust score for author:", error);
        }

        // 참여자들에게 +5점
        const participants = await PostParticipantRepo.findByPostId(id);
        const participantUserIds: string[] = [];

        for (const participant of participants) {
          try {
            await UserService.updateTrustScore(participant.userId, 5);
            participantUserIds.push(participant.userId);
          } catch (error) {
            console.error(
              `Failed to update trust score for participant ${participant.userId}:`,
              error
            );
          }
        }

        // 공동구매 완료 알림 생성 (주최자 + 참여자)
        try {
          const allUserIds = [oldPost.authorId, ...participantUserIds];
          await NotificationService.createPostCompletedNotification(
            id,
            allUserIds
          );
        } catch (error) {
          console.error("Failed to create completion notification:", error);
        }
      } else if (patch.status === "cancelled") {
        // 공동구매 취소: 주최자 -5점
        try {
          await UserService.updateTrustScore(oldPost.authorId, -5);
        } catch (error) {
          console.error("Failed to update trust score for author:", error);
        }

        // 공동구매 취소 알림 생성 (참여자 + 관심 등록자)
        try {
          const participants = await PostParticipantRepo.findByPostId(id);
          const participantUserIds = participants.map((p) => p.userId);

          // 관심 등록자 목록 가져오기
          const { FavoriteRepo } = await import("../repos/FavoriteRepo");
          const favorites = await FavoriteRepo.findByPostId(id);
          const favoriteUserIds = favorites.map((f) => f.userId);

          // 중복 제거
          const allUserIds = [
            ...new Set([...participantUserIds, ...favoriteUserIds]),
          ];

          if (allUserIds.length > 0) {
            await NotificationService.createPostCancelledNotification(
              id,
              allUserIds
            );
          }
        } catch (error) {
          console.error("Failed to create cancellation notification:", error);
        }
      }
    }

    return newPost;
  },

  /**
   * 삭제
   * - 삭제 시 주최자 신뢰점수 -5점
   */
  async deletePost(id: string) {
    // 삭제 전에 게시글 정보 조회
    const post = await PostRepo.findById(id);
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    await PostRepo.delete(id);

    // 주최자 신뢰점수 감소
    try {
      await UserService.updateTrustScore(post.authorId, -5);
    } catch (error) {
      // 신뢰점수 업데이트 실패해도 게시글 삭제는 성공으로 처리
      console.error("Failed to update trust score for author:", error);
    }
  },
};

// 참여 기능을 위한 별도 Service
export const PostParticipantService = {
  /**
   * 공동구매 참여
   * - 참여 후 currentQuantity 업데이트
   * - 주최자에게 새 참여자 알림 생성
   */
  async joinPost(postId: string, userId: string) {
    // 참여 처리
    const participant = await PostParticipantRepo.create({
      postId,
      userId,
    });

    // currentQuantity 업데이트
    const count = await PostParticipantRepo.countByPostId(postId);
    await PostModel.update(
      { currentQuantity: count },
      { where: { id: postId } }
    );

    // 주최자에게 새 참여자 알림 생성
    try {
      await NotificationService.createNewParticipantNotification(
        postId,
        userId
      );
    } catch (error) {
      // 알림 생성 실패해도 참여는 성공으로 처리
      console.error("Failed to create notification:", error);
    }

    return participant;
  },

  /**
   * 참여 취소
   * - 취소 후 currentQuantity 업데이트
   * - 참여자 신뢰점수 -3점
   * - 주최자에게 참여자 취소 알림 생성
   */
  async leavePost(postId: string, userId: string) {
    await PostParticipantRepo.delete(postId, userId);

    // currentQuantity 업데이트
    const count = await PostParticipantRepo.countByPostId(postId);
    await PostModel.update(
      { currentQuantity: count },
      { where: { id: postId } }
    );

    // 참여자 신뢰점수 감소
    try {
      await UserService.updateTrustScore(userId, -3);
    } catch (error) {
      // 신뢰점수 업데이트 실패해도 참여 취소는 성공으로 처리
      console.error("Failed to update trust score for participant:", error);
    }

    // 주최자에게 참여자 취소 알림 생성
    try {
      await NotificationService.createParticipantCancelNotification(
        postId,
        userId
      );
    } catch (error) {
      // 알림 생성 실패해도 참여 취소는 성공으로 처리
      console.error("Failed to create notification:", error);
    }
  },

  /**
   * 게시글의 참여자 목록 조회
   */
  async getParticipants(postId: string) {
    return await PostParticipantRepo.findByPostId(postId);
  },

  /**
   * 사용자가 참여한 게시글 목록 조회
   */
  async getParticipatedPosts(userId: string) {
    return await PostParticipantRepo.findByUserId(userId);
  },

  /**
   * 사용자가 특정 게시글에 참여했는지 확인
   */
  async isParticipant(postId: string, userId: string) {
    return await PostParticipantRepo.isParticipant(postId, userId);
  },
};
