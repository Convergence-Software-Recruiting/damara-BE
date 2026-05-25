import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import { PostExceptionCreationAttributes } from "../models/PostException";
import UserModel from "../models/User";
import { PostExceptionRepo } from "../repos/PostExceptionRepo";
import { PostParticipantRepo } from "../repos/PostParticipantRepo";
import { PostRepo } from "../repos/PostRepo";
import {
  POST_EXCEPTION_DEFAULT_DISPLAY_TITLES,
  POST_EXCEPTION_DEFAULT_SEVERITY,
  POST_EXCEPTION_HANDLING_GUIDES,
  POST_EXCEPTION_TYPE_LABELS,
  PostExceptionStatus,
  PostExceptionType,
} from "../types/post-exception";
import { NotificationService } from "./NotificationService";

type PostExceptionSource = Awaited<
  ReturnType<typeof PostExceptionRepo.findById>
>;

function enrichException(exception: NonNullable<PostExceptionSource>) {
  return {
    ...exception,
    displayTitle:
      exception.displayTitle ||
      POST_EXCEPTION_DEFAULT_DISPLAY_TITLES[exception.type],
    displayMessage: exception.displayMessage || exception.reason,
    severity:
      exception.severity || POST_EXCEPTION_DEFAULT_SEVERITY[exception.type],
    typeLabel: POST_EXCEPTION_TYPE_LABELS[exception.type],
    handlingGuide: POST_EXCEPTION_HANDLING_GUIDES[exception.type],
  };
}

async function assertCanAccessPostException(postId: string, userId: string) {
  const post = await PostRepo.findById(postId);
  if (!post) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
  }

  const user = await UserModel.findByPk(userId);
  if (!user) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "USER_NOT_FOUND");
  }

  const isOwner = post.authorId === userId;
  const isParticipant = await PostParticipantRepo.isParticipant(postId, userId);

  if (!isOwner && !isParticipant) {
    throw new RouteError(
      HttpStatusCodes.FORBIDDEN,
      "작성자 또는 참여자만 예외 케이스를 등록할 수 있습니다.",
      "FORBIDDEN"
    );
  }

  return { post, isOwner, isParticipant };
}

async function notifyPostExceptionTargets(
  postId: string,
  reporterId: string,
  type: PostExceptionType,
  displayTitle: string
) {
  const post = await PostRepo.findById(postId);
  if (!post) {
    return;
  }

  const participants = await PostParticipantRepo.findByPostId(postId);
  const targetUserIds = new Set([
    post.authorId,
    ...participants.map((participant) => participant.userId),
  ]);
  targetUserIds.delete(reporterId);

  for (const userId of targetUserIds) {
    await NotificationService.createNotification({
      userId,
      type: "post_exception",
      title: displayTitle,
      message: `${post.title}에 ${POST_EXCEPTION_TYPE_LABELS[type]} 예외가 등록되었습니다.`,
      postId,
      actionUrl: `/post/${postId}`,
      isRead: false,
    });
  }
}

export const PostExceptionService = {
  async createPostException(
    postId: string,
    data: Omit<PostExceptionCreationAttributes, "postId" | "reporterId"> & {
      reporterId: string;
    }
  ) {
    const { isOwner } = await assertCanAccessPostException(
      postId,
      data.reporterId
    );

    if (data.type === "seller_cancelled" && !isOwner) {
      throw new RouteError(
        HttpStatusCodes.FORBIDDEN,
        "주최자 취소 예외는 작성자만 등록할 수 있습니다.",
        "FORBIDDEN"
      );
    }

    const displayTitle =
      data.displayTitle || POST_EXCEPTION_DEFAULT_DISPLAY_TITLES[data.type];
    const displayMessage = data.displayMessage || data.reason;
    const severity = data.severity || POST_EXCEPTION_DEFAULT_SEVERITY[data.type];

    const created = await PostExceptionRepo.create({
      ...data,
      postId,
      reporterId: data.reporterId,
      displayTitle,
      displayMessage,
      severity,
      status: "open",
    });

    await notifyPostExceptionTargets(
      postId,
      data.reporterId,
      data.type,
      displayTitle
    );

    return enrichException(created as NonNullable<PostExceptionSource>);
  },

  async listPostExceptions(postId: string, limit = 20, offset = 0) {
    const post = await PostRepo.findById(postId);
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    const [exceptions, total] = await Promise.all([
      PostExceptionRepo.findByPostId(postId, limit, offset),
      PostExceptionRepo.countByPostId(postId),
    ]);

    return {
      exceptions: exceptions.map((exception) =>
        enrichException(exception as NonNullable<PostExceptionSource>)
      ),
      total,
      limit,
      offset,
      hasNext: offset + exceptions.length < total,
    };
  },

  async updatePostExceptionStatus(
    postId: string,
    exceptionId: string,
    status: PostExceptionStatus,
    actorUserId: string,
    resolutionNote?: string | null
  ) {
    const { post } = await assertCanAccessPostException(postId, actorUserId);
    const postException = await PostExceptionRepo.findById(exceptionId);

    if (!postException || postException.postId !== postId) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "POST_EXCEPTION_NOT_FOUND"
      );
    }

    const canResolve =
      post.authorId === actorUserId || postException.reporterId === actorUserId;

    if (!canResolve) {
      throw new RouteError(
        HttpStatusCodes.FORBIDDEN,
        "작성자 또는 예외 등록자만 상태를 변경할 수 있습니다.",
        "FORBIDDEN"
      );
    }

    const updated = await PostExceptionRepo.updateStatus(
      exceptionId,
      status,
      resolutionNote
    );

    return enrichException(updated as NonNullable<PostExceptionSource>);
  },

  async getExceptionSummary(postId: string) {
    const [latestOpenException, openCount] = await Promise.all([
      PostExceptionRepo.findLatestOpenByPostId(postId),
      PostExceptionRepo.countOpenByPostId(postId),
    ]);

    if (!latestOpenException) {
      return {
        hasOpenException: false,
        openCount: 0,
        latestType: null,
        latestTitle: null,
        latestMessage: null,
        severity: null,
        latest: null,
      };
    }

    const enrichedLatest = enrichException(
      latestOpenException as NonNullable<PostExceptionSource>
    );

    return {
      hasOpenException: true,
      openCount,
      latestType: enrichedLatest.type,
      latestTitle: enrichedLatest.displayTitle,
      latestMessage: enrichedLatest.displayMessage,
      severity: enrichedLatest.severity,
      latest: enrichedLatest,
    };
  },
};
