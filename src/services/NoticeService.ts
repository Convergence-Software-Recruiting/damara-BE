import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import { NoticeRepo } from "../repos/NoticeRepo";
import { NOTICE_TYPES, NoticeType } from "../types/notice";

type ListNoticeParams = {
  limit: number;
  offset: number;
  type?: string;
};

function normalizePagination(limit: number, offset: number) {
  return {
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20,
    offset: Number.isFinite(offset) ? Math.max(offset, 0) : 0,
  };
}

function parseNoticeType(type?: string): NoticeType | undefined {
  if (!type) {
    return undefined;
  }

  if (!NOTICE_TYPES.includes(type as NoticeType)) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "INVALID_NOTICE_TYPE");
  }

  return type as NoticeType;
}

function getNoticeCategory(notice: { summary: string | null; type: NoticeType }) {
  if (notice.summary) {
    return notice.summary;
  }

  const typeLabels: Record<NoticeType, string> = {
    service: "서비스 안내",
    event: "이벤트",
    maintenance: "점검 안내",
    policy: "운영 정책",
  };

  return typeLabels[notice.type];
}

function withNoticeCategory<T extends { summary: string | null; type: NoticeType }>(
  notice: T
) {
  return {
    ...notice,
    category: getNoticeCategory(notice),
  };
}

export const NoticeService = {
  async listNotices(params: ListNoticeParams) {
    const { limit, offset } = normalizePagination(params.limit, params.offset);
    const type = parseNoticeType(params.type);

    const [notices, total] = await Promise.all([
      NoticeRepo.list({ limit, offset, type }),
      NoticeRepo.count({ type }),
    ]);

    return {
      notices: notices.map(withNoticeCategory),
      total,
      limit,
      offset,
      hasNext: offset + notices.length < total,
    };
  },

  async getNoticeById(id: string) {
    const notice = await NoticeRepo.findById(id);

    if (!notice) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NOTICE_NOT_FOUND");
    }

    return withNoticeCategory(notice);
  },
};
