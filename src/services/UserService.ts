// src/services/UserService.ts

import { UserRepo } from "../repos/UserRepo";
import { UserCreationAttributes } from "../models/User";
import {
  EmailAlreadyExistsError,
  RouteError,
  InvalidCredentialsError,
  StudentIdAlreadyExistsError,
} from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import bcrypt from "bcrypt";
import { TrustService } from "./TrustService";
import { PostRepo } from "../repos/PostRepo";
import { FavoriteRepo } from "../repos/FavoriteRepo";
import { PostParticipantRepo } from "../repos/PostParticipantRepo";
import { PostService } from "./PostService";
import { PostListOptions, PostListStatus } from "../types/post-list";
import {
  MY_POSTS_TABS,
  MyPostsListOptions,
  MyPostsTab,
} from "../types/my-posts";
import {
  PARTICIPANT_STATUS_LABELS,
  ParticipantStatus,
} from "../types/participant-status";

type MyPostsSummaryOptions = {
  deadlineSoonHours: number;
  recentDays: number;
};

const POST_STATUSES: PostListStatus[] = [
  "open",
  "closed",
  "in_progress",
  "completed",
  "cancelled",
];

const isPostStatus = (status?: string | null): status is PostListStatus =>
  Boolean(status && POST_STATUSES.includes(status as PostListStatus));

const PARTICIPANT_STATUS_ALIASES: Record<string, ParticipantStatus> = {
  participating: "participating",
  paymentPending: "payment_pending",
  payment_pending: "payment_pending",
  pickupReady: "pickup_ready",
  pickup_ready: "pickup_ready",
  received: "received",
};

function normalizeParticipantStatus(status?: string | null) {
  if (!status) {
    return null;
  }

  return PARTICIPANT_STATUS_ALIASES[status] ?? null;
}

function getNowPlusHours(hours: number) {
  const now = new Date();
  return {
    now,
    deadlineSoonUntil: new Date(now.getTime() + hours * 60 * 60 * 1000),
  };
}

function getRecentSince(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function resolvePostFilters(
  options: MyPostsListOptions,
  tab: MyPostsTab
): PostListOptions & {
  participantStatus?: ParticipantStatus | null;
  recentSince?: Date | null;
} {
  const { status } = options;
  const postOptions: PostListOptions & {
    participantStatus?: ParticipantStatus | null;
    recentSince?: Date | null;
  } = {
    limit: options.limit,
    offset: options.offset,
    keyword: options.keyword,
    category: options.category,
    sort: options.sort,
    userId: null,
  };

  if (!status) {
    return postOptions;
  }

  if (tab === "registered") {
    if (status === "inProgress") {
      postOptions.statuses = ["open", "closed", "in_progress"];
      return postOptions;
    }

    if (status === "deadlineSoon") {
      const { now, deadlineSoonUntil } = getNowPlusHours(
        options.deadlineSoonHours
      );
      postOptions.status = "open";
      postOptions.deadlineFrom = now;
      postOptions.deadlineTo = deadlineSoonUntil;
      return postOptions;
    }

    if (status === "completed") {
      postOptions.status = "completed";
      return postOptions;
    }

    if (isPostStatus(status)) {
      postOptions.status = status;
    }

    return postOptions;
  }

  if (tab === "participated") {
    const participantStatus = normalizeParticipantStatus(status);
    if (participantStatus) {
      postOptions.participantStatus = participantStatus;
      return postOptions;
    }

    if (isPostStatus(status)) {
      postOptions.status = status;
    }

    return postOptions;
  }

  if (status === "deadlineSoon") {
    const { now, deadlineSoonUntil } = getNowPlusHours(options.deadlineSoonHours);
    postOptions.status = "open";
    postOptions.deadlineFrom = now;
    postOptions.deadlineTo = deadlineSoonUntil;
    return postOptions;
  }

  if (status === "recent") {
    postOptions.recentSince = getRecentSince(options.recentDays);
    return postOptions;
  }

  if (isPostStatus(status)) {
    postOptions.status = status;
  }

  return postOptions;
}

function comparePopularCards(a: any, b: any) {
  const participantDiff =
    Number(b.currentQuantity || 0) - Number(a.currentQuantity || 0);
  if (participantDiff !== 0) {
    return participantDiff;
  }

  const favoriteDiff = Number(b.favoriteCount || 0) - Number(a.favoriteCount || 0);
  if (favoriteDiff !== 0) {
    return favoriteDiff;
  }

  return (
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
}

function paginatePopularItems<T>(
  items: T[],
  options: Pick<MyPostsListOptions, "sort" | "offset" | "limit">
) {
  if (options.sort !== "popular") {
    return items;
  }

  return [...items]
    .sort(comparePopularCards)
    .slice(options.offset, options.offset + options.limit);
}

function getRegisteredMyPostStatus(post: any, deadlineSoonHours: number) {
  if (post.status === "completed") {
    return "completed";
  }

  if (post.status === "cancelled") {
    return "cancelled";
  }

  const deadlineTime = new Date(post.deadline).getTime();
  const deadlineSoonUntil = Date.now() + deadlineSoonHours * 60 * 60 * 1000;

  if (
    post.status === "open" &&
    !Number.isNaN(deadlineTime) &&
    deadlineTime >= Date.now() &&
    deadlineTime <= deadlineSoonUntil
  ) {
    return "deadlineSoon";
  }

  return "inProgress";
}

export const UserService = {
  /**
   * 회원가입 기능
   * - Service는 DB 또는 HTTP를 몰라야 한다
   * - 순수 비즈니스 로직만 처리 (중복 체크, 비밀번호 해싱)
   */
  async registerUser(data: UserCreationAttributes) {
    // 1) 이메일 중복 검사
    const emailExists = await UserRepo.findByEmail(data.email);
    if (emailExists) {
      throw new EmailAlreadyExistsError();
    }

    // 2) 학번 중복 검사
    const studentIdExists = await UserRepo.findByStudentId(data.studentId);
    if (studentIdExists) {
      throw new StudentIdAlreadyExistsError();
    }

    // 3) 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.passwordHash, 10);

    // 4) UserRepo를 통해 회원 생성
    const user = await UserRepo.create({
      ...data,
      passwordHash: hashedPassword,
    });

    return TrustService.withTrustGrade(user);
  },

  /**
   * 이메일로 사용자 조회 (로그인 시 사용 가능)
   */
  async getUserByEmail(email: string) {
    const user = await UserRepo.findByEmail(email);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }
    return user;
  },

  /**
   * 부분 업데이트
   */
  async updateUser(id: string, patch: Partial<UserCreationAttributes>) {
    const user = await UserRepo.update(id, patch);
    return TrustService.withTrustGrade(user);
  },

  /**
   * 삭제
   */
  async deleteUser(id: string) {
    await UserRepo.delete(id);
  },

  /**
   * 전체 조회 + pagination
   */
  async listUsers(limit = 20, offset = 0) {
    const users = await UserRepo.list(limit, offset);
    return users.map((user) => TrustService.withTrustGrade(user));
  },

  /**
   * 학번과 비밀번호로 로그인
   */
  async loginByStudentId(studentId: string, password: string) {
    // 1) 학번으로 사용자 찾기
    const user = await UserRepo.findByStudentId(studentId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 2) 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // 3) 비밀번호 해시는 제외하고 반환
    const { passwordHash, ...userWithoutPassword } = user;
    return TrustService.withTrustGrade(userWithoutPassword);
  },

  /**
   * 내부 신뢰점수 업데이트
   * @param userId 사용자 ID
   * @param scoreChange 점수 변화량 (양수: 증가, 음수: 감소)
   */
  async updateTrustScore(userId: string, scoreChange: number) {
    const event = await TrustService.applyEvent({
      userId,
      type: "manual_adjustment",
      scoreChange,
      reason: "UserService.updateTrustScore legacy adjustment",
    });

    return event.nextScore;
  },

  /**
   * 내 공구 화면 상단 요약 카운트
   */
  async getMyPostsSummary(userId: string, options: MyPostsSummaryOptions) {
    const user = await UserRepo.findById(userId);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    const now = new Date();
    const deadlineSoonUntil = new Date(
      now.getTime() + options.deadlineSoonHours * 60 * 60 * 1000
    );
    const recentSince = new Date(
      now.getTime() - options.recentDays * 24 * 60 * 60 * 1000
    );

    const [
      registeredInProgress,
      registeredDeadlineSoon,
      registeredCompleted,
      participatedParticipating,
      participatedPaymentPending,
      participatedPickupReady,
      participatedReceived,
      favoriteTotal,
      favoriteDeadlineSoon,
      favoriteRecent,
    ] = await Promise.all([
      PostRepo.countByAuthorIdAndStatuses(userId, [
        "open",
        "closed",
        "in_progress",
      ]),
      PostRepo.countDeadlineSoonByAuthorId(
        userId,
        now,
        deadlineSoonUntil
      ),
      PostRepo.countByAuthorIdAndStatuses(userId, ["completed"]),
      PostParticipantRepo.countByUserIdAndStatus(userId, "participating"),
      PostParticipantRepo.countByUserIdAndStatus(userId, "payment_pending"),
      PostParticipantRepo.countByUserIdAndStatus(userId, "pickup_ready"),
      PostParticipantRepo.countByUserIdAndStatus(userId, "received"),
      FavoriteRepo.countByUserId(userId),
      FavoriteRepo.countDeadlineSoonByUserId(userId, now, deadlineSoonUntil),
      FavoriteRepo.countRecentByUserId(userId, recentSince),
    ]);

    return {
      registered: {
        inProgress: registeredInProgress,
        deadlineSoon: registeredDeadlineSoon,
        completed: registeredCompleted,
      },
      participated: {
        participating: participatedParticipating,
        paymentPending: participatedPaymentPending,
        pickupReady: participatedPickupReady,
        received: participatedReceived,
      },
      favorites: {
        total: favoriteTotal,
        deadlineSoon: favoriteDeadlineSoon,
        recent: favoriteRecent,
      },
      meta: {
        deadlineSoonHours: options.deadlineSoonHours,
        recentDays: options.recentDays,
      },
    };
  },

  /**
   * 내 공구 탭별 카드 목록 조회
   */
  async listMyPosts(userId: string, options: MyPostsListOptions) {
    const user = await UserRepo.findById(userId);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }

    if (!MY_POSTS_TABS.includes(options.tab)) {
      throw new RouteError(HttpStatusCodes.BAD_REQUEST, "INVALID_TAB");
    }

    const postFilters = resolvePostFilters(options, options.tab);

    if (options.tab === "registered") {
      const listOptions = {
        ...postFilters,
        authorId: userId,
        userId,
      };
      const [posts, total] = await Promise.all([
        PostRepo.list(listOptions),
        PostRepo.count(listOptions),
      ]);
      const enrichedPosts = await Promise.all(
        posts.map((post) => PostService.enrichPostCard(post as any, userId))
      );
      const items = paginatePopularItems(
        enrichedPosts.map((post) => ({
          ...post,
          myPostTab: "registered",
          myPostRole: "owner",
          myPostStatus: getRegisteredMyPostStatus(
            post,
            options.deadlineSoonHours
          ),
        })),
        options
      );

      return {
        tab: options.tab,
        items,
        total,
        limit: options.limit,
        offset: options.offset,
        hasNext: options.offset + items.length < total,
        filters: {
          status: options.status ?? null,
          keyword: options.keyword ?? null,
          category: options.category ?? null,
          sort: options.sort ?? "latest",
        },
      };
    }

    if (options.tab === "participated") {
      const [participants, total] = await Promise.all([
        PostParticipantRepo.findMyPostsByUserId(userId, postFilters),
        PostParticipantRepo.countMyPostsByUserId(userId, postFilters),
      ]);
      const enrichedPosts = await Promise.all(
        participants.map(async (participant: any) => {
          const post = await PostService.enrichPostCard(participant.post, userId);
          return {
            ...post,
            myPostTab: "participated",
            myPostRole: "participant",
            myPostStatus: participant.participantStatus,
            participantId: participant.id,
            participantStatus: participant.participantStatus,
            participantStatusLabel:
              PARTICIPANT_STATUS_LABELS[
                participant.participantStatus as ParticipantStatus
              ],
            participatedAt: participant.createdAt,
          };
        })
      );
      const items = paginatePopularItems(enrichedPosts, options);

      return {
        tab: options.tab,
        items,
        total,
        limit: options.limit,
        offset: options.offset,
        hasNext: options.offset + items.length < total,
        filters: {
          status: options.status ?? null,
          keyword: options.keyword ?? null,
          category: options.category ?? null,
          sort: options.sort ?? "latest",
        },
      };
    }

    const [favorites, total] = await Promise.all([
      FavoriteRepo.findMyPostsByUserId(userId, postFilters),
      FavoriteRepo.countMyPostsByUserId(userId, postFilters),
    ]);
    const enrichedPosts = await Promise.all(
      favorites.map(async (favorite: any) => {
        const post = await PostService.enrichPostCard(favorite.post, userId);
        return {
          ...post,
          myPostTab: "favorites",
          myPostRole: "favorite",
          myPostStatus: options.status ?? "favorite",
          favoriteId: favorite.id,
          favoritedAt: favorite.createdAt,
        };
      })
    );
    const items = paginatePopularItems(enrichedPosts, options);

    return {
      tab: options.tab,
      items,
      total,
      limit: options.limit,
      offset: options.offset,
      hasNext: options.offset + items.length < total,
      filters: {
        status: options.status ?? null,
        keyword: options.keyword ?? null,
        category: options.category ?? null,
        sort: options.sort ?? "latest",
      },
    };
  },

  /**
   * 사용자 ID로 조회
   */
  async getUserById(id: string) {
    const user = await UserRepo.findById(id);
    if (!user) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
    }
    // 비밀번호 해시 제외
    const { passwordHash, ...userWithoutPassword } = user;
    return TrustService.withTrustGrade(userWithoutPassword);
  },
};
