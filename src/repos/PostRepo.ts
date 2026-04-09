// src/repos/PostRepo.ts (Sequelize 버전)

import { PostModel, PostCreationAttributes } from "../models/Post";
import PostImageModel from "../models/PostImage";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";

export const PostRepo = {
  /**
   * 공동구매 상품 생성
   * 이미지 URL 배열을 받아서 post_images 테이블에 저장
   */
  async create(data: PostCreationAttributes, imageUrls: string[] = []) {
    try {
      const post = await PostModel.create(data);

      // 이미지가 있으면 post_images 테이블에 저장
      if (imageUrls.length > 0) {
        await PostImageModel.bulkCreate(
          imageUrls.map((url, index) => ({
            postId: post.id,
            imageUrl: url,
            sortOrder: index,
          }))
        );
      }

      // 이미지와 함께 조회해서 반환
      return await PostModel.findByPk(post.id, {
        include: [
          {
            model: PostImageModel,
            as: "images",
            attributes: ["id", "imageUrl", "sortOrder"],
          },
        ],
      });
    } catch (e: unknown) {
      throw e;
    }
  },

  /**
   * ID로 상품 조회 (이미지 포함)
   */
  async findById(id: string) {
    const post = await PostModel.findByPk(id, {
      include: [
        {
          model: PostImageModel,
          as: "images",
          attributes: ["id", "imageUrl", "sortOrder"],
          order: [["sortOrder", "ASC"]],
        },
      ],
    });

    return post ? post.get() : null;
  },

  /**
   * 전체 조회 + pagination (이미지 포함)
   * category 필터링 지원
   */
  async list(limit = 20, offset = 0, category?: string | null) {
    const whereClause: any = {};
    // category가 제공되고 빈 문자열이 아닐 때만 필터링
    if (
      category &&
      category !== null &&
      category !== undefined &&
      String(category).trim() !== ""
    ) {
      const categoryValue = String(category).trim();
      whereClause.category = categoryValue;
      console.log("PostRepo.list - 카테고리 필터링:", {
        요청카테고리: categoryValue,
        whereClause카테고리: whereClause.category,
      });
    } else {
      console.log("PostRepo.list - 전체 조회 (카테고리 없음)");
    }

    const posts = await PostModel.findAll({
      where: whereClause,
      include: [
        {
          model: PostImageModel,
          as: "images",
          attributes: ["id", "imageUrl", "sortOrder"],
          order: [["sortOrder", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const result = posts.map((p) => p.get());

    // 디버깅: 조회된 게시글들의 카테고리 확인
    if (whereClause.category) {
      console.log(
        "PostRepo.list - 조회된 게시글 카테고리:",
        result.map((p) => ({ id: p.id, title: p.title, category: p.category }))
      );
    }

    return result;
  },

  /**
   * 작성자 ID로 조회
   */
  async findByAuthorId(authorId: string, limit = 20, offset = 0) {
    const posts = await PostModel.findAll({
      where: { authorId },
      include: [
        {
          model: PostImageModel,
          as: "images",
          attributes: ["id", "imageUrl", "sortOrder"],
          order: [["sortOrder", "ASC"]],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return posts.map((p) => p.get());
  },

  /**
   * 부분 업데이트
   */
  async update(id: string, patch: Partial<PostCreationAttributes>) {
    const post = await PostModel.findByPk(id);
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    await post.update(patch);

    // 이미지 업데이트가 있으면 처리
    const images = (patch as { images?: string[] }).images;
    if (images !== undefined) {
      // 기존 이미지 삭제
      await PostImageModel.destroy({ where: { postId: id } });

      // 새 이미지 추가
      if (images.length > 0) {
        await PostImageModel.bulkCreate(
          images.map((url, index) => ({
            postId: id,
            imageUrl: url,
            sortOrder: index,
          }))
        );
      }
    }

    // 이미지와 함께 조회해서 반환
    return await PostModel.findByPk(id, {
      include: [
        {
          model: PostImageModel,
          as: "images",
          attributes: ["id", "imageUrl", "sortOrder"],
          order: [["sortOrder", "ASC"]],
        },
      ],
    });
  },

  /**
   * 삭제 (CASCADE로 이미지도 자동 삭제됨)
   */
  async delete(id: string) {
    const deleted = await PostModel.destroy({ where: { id } });
    if (deleted === 0) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }
  },
};
