// src/repos/FavoriteRepo.ts

import FavoriteModel, { FavoriteCreationAttributes } from "../models/Favorite";
import PostModel from "../models/Post";
import PostImageModel from "../models/PostImage";
import UserModel from "../models/User";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { Op } from "sequelize";
import {
  buildPostListWhere,
} from "./PostRepo";
import { PostListOptions } from "../types/post-list";

export const FavoriteRepo = {
  /**
   * 관심 등록
   */
  async create(data: FavoriteCreationAttributes) {
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

      const favorite = await FavoriteModel.create(data);
      return favorite.get();
    } catch (e: unknown) {
      // 이미 관심 등록한 경우
      if (e instanceof Error && e.name === "SequelizeUniqueConstraintError") {
        throw new RouteError(
          HttpStatusCodes.BAD_REQUEST,
          "ALREADY_FAVORITED"
        );
      }
      throw e;
    }
  },

  /**
   * 관심 해제
   */
  async delete(postId: string, userId: string) {
    const deleted = await FavoriteModel.destroy({
      where: { postId, userId },
    });

    if (deleted === 0) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "FAVORITE_NOT_FOUND");
    }
  },

  /**
   * 관심 여부 확인
   */
  async isFavorite(postId: string, userId: string) {
    const favorite = await FavoriteModel.findOne({
      where: { postId, userId },
    });
    return favorite !== null;
  },

  /**
   * 사용자별 관심 목록 조회
   */
  async findByUserId(userId: string, limit = 20, offset = 0) {
    const favorites = await FavoriteModel.findAll({
      where: { userId },
      include: [
        {
          model: PostModel,
          as: "post",
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
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return favorites.map((f) => f.get());
  },

  /**
   * 내 공구 관심 탭 목록 조회
   */
  async findMyPostsByUserId(
    userId: string,
    options: PostListOptions & { recentSince?: Date | null } = {}
  ) {
    const {
      limit = 20,
      offset = 0,
      sort = "latest",
      recentSince,
    } = options;
    const favoriteWhere: Record<string, unknown> = { userId };

    if (recentSince) {
      favoriteWhere.createdAt = {
        [Op.gte]: recentSince,
      };
    }

    const order =
      sort === "deadline"
        ? [[{ model: PostModel, as: "post" }, "deadline", "ASC"]]
        : [["createdAt", "DESC"]];

    const queryOptions: any = {
      where: favoriteWhere,
      include: [
        {
          model: PostModel,
          as: "post",
          required: true,
          where: buildPostListWhere(options),
          include: [
            {
              model: PostImageModel,
              as: "images",
              attributes: ["id", "imageUrl", "sortOrder"],
              order: [["sortOrder", "ASC"]],
            },
          ],
        },
      ],
      order: order as any,
    };

    if (sort !== "popular") {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const favorites = await FavoriteModel.findAll(queryOptions);

    return favorites.map((favorite) => favorite.get({ plain: true }));
  },

  /**
   * 내 공구 관심 탭 목록 개수 조회
   */
  async countMyPostsByUserId(
    userId: string,
    options: PostListOptions & { recentSince?: Date | null } = {}
  ) {
    const { recentSince } = options;
    const favoriteWhere: Record<string, unknown> = { userId };

    if (recentSince) {
      favoriteWhere.createdAt = {
        [Op.gte]: recentSince,
      };
    }

    return await FavoriteModel.count({
      where: favoriteWhere,
      include: [
        {
          model: PostModel,
          as: "post",
          required: true,
          where: buildPostListWhere(options),
        },
      ],
    });
  },

  /**
   * 게시글별 관심 수 조회
   */
  async countByPostId(postId: string) {
    return await FavoriteModel.count({
      where: { postId },
    });
  },

  /**
   * 게시글별 관심 등록자 목록 조회
   */
  async findByPostId(postId: string) {
    const favorites = await FavoriteModel.findAll({
      where: { postId },
      attributes: ["userId"],
    });

    return favorites.map((f) => f.get());
  },

  /**
   * 사용자별 관심 개수
   */
  async countByUserId(userId: string) {
    return await FavoriteModel.count({
      where: { userId },
    });
  },

  /**
   * 사용자 관심 공구 중 마감임박 게시글 수 조회
   */
  async countDeadlineSoonByUserId(userId: string, from: Date, to: Date) {
    return await FavoriteModel.count({
      where: { userId },
      include: [
        {
          model: PostModel,
          as: "post",
          required: true,
          where: {
            status: "open",
            deadline: {
              [Op.gte]: from,
              [Op.lte]: to,
            },
          },
        },
      ],
    });
  },

  /**
   * 사용자가 최근 관심 등록한 공구 수 조회
   */
  async countRecentByUserId(userId: string, since: Date) {
    return await FavoriteModel.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: since,
        },
      },
    });
  },
};
