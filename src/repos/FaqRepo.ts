import { FindOptions, WhereOptions } from "sequelize";
import FaqModel, { FaqAttributes } from "../models/Faq";
import { FaqCategory } from "../types/faq";

type ListFaqOptions = {
  limit: number;
  offset: number;
  category?: FaqCategory;
  isActive?: boolean;
};

function buildListOptions(options: ListFaqOptions): FindOptions {
  const where: WhereOptions<FaqAttributes> = {};

  if (options.category) {
    where.category = options.category;
  }

  if (typeof options.isActive === "boolean") {
    where.isActive = options.isActive;
  }

  return {
    where,
    order: [
      ["order", "ASC"],
      ["createdAt", "DESC"],
    ],
    limit: options.limit,
    offset: options.offset,
  };
}

export const FaqRepo = {
  async list(options: ListFaqOptions) {
    const faqs = await FaqModel.findAll(buildListOptions(options));
    return faqs.map((faq) => faq.get());
  },

  async count(options: Pick<ListFaqOptions, "category" | "isActive">) {
    const where: WhereOptions<FaqAttributes> = {};

    if (options.category) {
      where.category = options.category;
    }

    if (typeof options.isActive === "boolean") {
      where.isActive = options.isActive;
    }

    return await FaqModel.count({ where });
  },
};
