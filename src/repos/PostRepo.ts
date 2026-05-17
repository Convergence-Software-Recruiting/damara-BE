// src/repos/PostRepo.ts (Sequelize 버전)

import { PostModel, PostCreationAttributes } from "../models/Post";
import PostImageModel from "../models/PostImage";
import UserModel from "../models/User";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { literal, Op, Order } from "sequelize";
import { PostListOptions } from "../types/post-list";

const CATEGORY_SEARCH_LABELS: Record<string, string[]> = {
  food: ["food", "먹거리"],
  daily: ["daily", "생활용품", "일상용품"],
  beauty: ["beauty", "뷰티", "패션", "뷰티·패션", "뷰티・패션"],
  electronics: ["electronics", "전자기기"],
  school: ["school", "학용품"],
  freemarket: ["freemarket", "프리마켓"],
};

function findCategoryValuesByKeyword(keyword: string) {
  const normalizedKeyword = keyword.toLowerCase();

  return Object.entries(CATEGORY_SEARCH_LABELS)
    .filter(([category, labels]) => {
      const values = [category, ...labels].map((label) => label.toLowerCase());
      return values.some(
        (label) =>
          label.includes(normalizedKeyword) ||
          normalizedKeyword.includes(label)
      );
    })
    .map(([category]) => category);
}

export function buildPostListWhere(options: PostListOptions = {}) {
  const {
    authorId,
    category,
    status,
    statuses,
    deadlineFrom,
    deadlineTo,
    keyword,
  } = options;
  const whereClause: any = {};

  if (authorId && String(authorId).trim() !== "") {
    whereClause.authorId = String(authorId).trim();
  }

  if (
    category &&
    category !== null &&
    category !== undefined &&
    String(category).trim() !== ""
  ) {
    whereClause.category = String(category).trim();
  }

  if (status) {
    whereClause.status = status;
  }

  if (statuses && statuses.length > 0) {
    whereClause.status = {
      [Op.in]: statuses,
    };
  }

  if (deadlineFrom || deadlineTo) {
    whereClause.deadline = {};

    if (deadlineFrom) {
      whereClause.deadline[Op.gte] = deadlineFrom;
    }

    if (deadlineTo) {
      whereClause.deadline[Op.lte] = deadlineTo;
    }
  }

  const normalizedKeyword =
    keyword && String(keyword).trim() !== ""
      ? String(keyword).trim()
      : null;

  if (normalizedKeyword) {
    const keywordFilters: any[] = [
      { title: { [Op.like]: `%${normalizedKeyword}%` } },
      { productName: { [Op.like]: `%${normalizedKeyword}%` } },
      { content: { [Op.like]: `%${normalizedKeyword}%` } },
      { pickupLocation: { [Op.like]: `%${normalizedKeyword}%` } },
      { pickupGuide: { [Op.like]: `%${normalizedKeyword}%` } },
      { notice: { [Op.like]: `%${normalizedKeyword}%` } },
      { category: { [Op.like]: `%${normalizedKeyword}%` } },
    ];
    const categoryValues = findCategoryValuesByKeyword(normalizedKeyword);

    if (categoryValues.length > 0) {
      keywordFilters.push({
        category: {
          [Op.in]: categoryValues,
        },
      });
    }

    whereClause[Op.or] = keywordFilters;
  }

  return whereClause;
}

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
   * 상세 화면용 상품 조회 (이미지 + 작성자 공개 프로필 포함)
   */
  async findDetailById(id: string) {
    const post = await PostModel.findByPk(id, {
      include: [
        {
          model: PostImageModel,
          as: "images",
          attributes: ["id", "imageUrl", "sortOrder"],
          order: [["sortOrder", "ASC"]],
        },
        {
          model: UserModel,
          as: "author",
          attributes: [
            "id",
            "nickname",
            "studentId",
            "department",
            "avatarUrl",
            "trustScore",
          ],
        },
      ],
    });

    return post ? post.get({ plain: true }) : null;
  },

  /**
   * 전체 조회 + pagination (이미지 포함)
   * category/status/keyword 필터링 및 홈 피드 정렬 지원
   */
  async list(options: PostListOptions = {}) {
    const {
      limit = 20,
      offset = 0,
      sort = "latest",
    } = options;
    const whereClause = buildPostListWhere(options);

    const order: Order =
      sort === "deadline"
        ? [
            [literal("CASE WHEN deadline >= NOW() THEN 0 ELSE 1 END"), "ASC"],
            ["deadline", "ASC"],
            ["createdAt", "DESC"],
          ]
        : [["createdAt", "DESC"]];

    const queryOptions: any = {
      where: whereClause,
      include: [
        {
          model: PostImageModel,
          as: "images",
          attributes: ["id", "imageUrl", "sortOrder"],
          order: [["sortOrder", "ASC"]],
        },
      ],
      order,
    };

    if (sort !== "popular") {
      queryOptions.limit = limit;
      queryOptions.offset = offset;
    }

    const posts = await PostModel.findAll(queryOptions);

    const result = posts.map((p) => p.get());

    return result;
  },

  /**
   * 목록 필터 기준 전체 개수 조회
   */
  async count(options: PostListOptions = {}) {
    return await PostModel.count({
      where: buildPostListWhere(options),
    });
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
   * 작성자별 상태 카운트 조회
   */
  async countByAuthorIdAndStatuses(authorId: string, statuses: string[]) {
    return await PostModel.count({
      where: {
        authorId,
        status: {
          [Op.in]: statuses,
        },
      },
    });
  },

  /**
   * 작성자별 마감임박 게시글 수 조회
   * - 모집중(open) 게시글 중 현재 시각 이후, 기준 시간 이내 마감만 포함
   */
  async countDeadlineSoonByAuthorId(
    authorId: string,
    from: Date,
    to: Date
  ) {
    return await PostModel.count({
      where: {
        authorId,
        status: "open",
        deadline: {
          [Op.gte]: from,
          [Op.lte]: to,
        },
      },
    });
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
