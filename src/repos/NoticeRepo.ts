import { FindOptions, WhereOptions } from "sequelize";
import NoticeModel, { NoticeAttributes } from "../models/Notice";
import { NoticeType } from "../types/notice";

type ListNoticeOptions = {
  limit: number;
  offset: number;
  type?: NoticeType;
};

function buildListOptions(options: ListNoticeOptions): FindOptions {
  const where: WhereOptions<NoticeAttributes> = {};

  if (options.type) {
    where.type = options.type;
  }

  return {
    where,
    order: [
      ["isPinned", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit: options.limit,
    offset: options.offset,
  };
}

export const NoticeRepo = {
  async list(options: ListNoticeOptions) {
    const notices = await NoticeModel.findAll(buildListOptions(options));
    return notices.map((notice) => notice.get());
  },

  async count(options: Pick<ListNoticeOptions, "type">) {
    const where: WhereOptions<NoticeAttributes> = {};

    if (options.type) {
      where.type = options.type;
    }

    return await NoticeModel.count({ where });
  },

  async findById(id: string) {
    const notice = await NoticeModel.findByPk(id);
    return notice ? notice.get() : null;
  },
};
