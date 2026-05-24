// src/services/FavoriteService.ts

import { FavoriteRepo } from "../repos/FavoriteRepo";
import { FavoriteCreationAttributes } from "../models/Favorite";

export const FavoriteService = {
  /**
   * 관심 등록
   */
  async addFavorite(postId: string, userId: string) {
    const favorite = await FavoriteRepo.create({ postId, userId });
    const favoriteCount = await this.getFavoriteCount(postId);

    return {
      ...favorite,
      isFavorite: true,
      favoriteCount,
    };
  },

  /**
   * 관심 해제
   */
  async removeFavorite(postId: string, userId: string) {
    await FavoriteRepo.delete(postId, userId);
    const favoriteCount = await this.getFavoriteCount(postId);

    return {
      message: "관심 해제되었습니다.",
      isFavorite: false,
      favoriteCount,
    };
  },

  /**
   * 관심 여부 확인
   */
  async isFavorite(postId: string, userId: string) {
    return await FavoriteRepo.isFavorite(postId, userId);
  },

  /**
   * 관심 여부와 현재 관심 수를 함께 조회
   */
  async getFavoriteState(postId: string, userId: string) {
    const [isFavorite, favoriteCount] = await Promise.all([
      FavoriteRepo.isFavorite(postId, userId),
      FavoriteRepo.countByPostId(postId),
    ]);

    return {
      isFavorite,
      favoriteCount,
    };
  },

  /**
   * 사용자별 관심 목록 조회
   */
  async getFavorites(userId: string, limit = 20, offset = 0) {
    const favorites = await FavoriteRepo.findByUserId(userId, limit, offset);
    const total = await FavoriteRepo.countByUserId(userId);

    return {
      favorites,
      total,
      limit,
      offset,
    };
  },

  /**
   * 게시글별 관심 수 조회
   */
  async getFavoriteCount(postId: string) {
    return await FavoriteRepo.countByPostId(postId);
  },
};
