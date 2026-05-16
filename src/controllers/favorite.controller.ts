// src/controllers/favorite.controller.ts

import { Request, Response, NextFunction } from "express";
import { FavoriteService } from "../services/FavoriteService";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";

/**
 * 관심 등록
 * POST /api/posts/:postId/favorite
 */
export async function addFavorite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId } = req.params;
    const userId = req.body.userId;

    if (!userId) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        error: "USER_ID_REQUIRED",
        message: "사용자 ID가 필요합니다.",
      });
    }

    const favorite = await FavoriteService.addFavorite(postId, userId);

    res.status(HttpStatusCodes.CREATED).json(favorite);
  } catch (error) {
    next(error);
  }
}

/**
 * 관심 해제
 * DELETE /api/posts/:postId/favorite/:userId
 */
export async function removeFavorite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId, userId } = req.params;

    const favorite = await FavoriteService.removeFavorite(postId, userId);

    res.status(HttpStatusCodes.OK).json(favorite);
  } catch (error) {
    next(error);
  }
}

/**
 * 관심 여부 확인
 * GET /api/posts/:postId/favorite/:userId
 */
export async function checkFavorite(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { postId, userId } = req.params;

    const isFavorite = await FavoriteService.isFavorite(postId, userId);

    res.status(HttpStatusCodes.OK).json({ isFavorite });
  } catch (error) {
    next(error);
  }
}

/**
 * 내가 관심 등록한 게시글 목록
 * GET /api/users/:userId/favorites
 */
export async function getFavorites(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.params;
    const limit = req.query.limit
      ? parseInt(req.query.limit as string, 10)
      : 20;
    const offset = req.query.offset
      ? parseInt(req.query.offset as string, 10)
      : 0;

    const result = await FavoriteService.getFavorites(userId, limit, offset);

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}
