import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import { FaqRepo } from "../repos/FaqRepo";
import { FAQ_CATEGORIES, FaqCategory } from "../types/faq";

type ListFaqParams = {
  limit: number;
  offset: number;
  category?: string;
};

function normalizePagination(limit: number, offset: number) {
  return {
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20,
    offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
  };
}

function parseFaqCategory(category?: string): FaqCategory | undefined {
  if (!category) {
    return undefined;
  }

  if (!FAQ_CATEGORIES.includes(category as FaqCategory)) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "INVALID_FAQ_CATEGORY");
  }

  return category as FaqCategory;
}

export const FaqService = {
  async listFaqs(params: ListFaqParams) {
    const { limit, offset } = normalizePagination(params.limit, params.offset);
    const category = parseFaqCategory(params.category);

    const [faqs, total] = await Promise.all([
      FaqRepo.list({ limit, offset, category, isActive: true }),
      FaqRepo.count({ category, isActive: true }),
    ]);

    return {
      faqs,
      total,
      limit,
      offset,
      hasNext: offset + faqs.length < total,
    };
  },
};
