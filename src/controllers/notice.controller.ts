import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { NoticeService } from "../services/NoticeService";

function parseInteger(value: unknown, fallback: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getNotices(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await NoticeService.listNotices({
      limit: parseInteger(req.query.limit, 20),
      offset: parseInteger(req.query.offset, 0),
      type: typeof req.query.type === "string" ? req.query.type : undefined,
    });

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getNoticeById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const notice = await NoticeService.getNoticeById(req.params.id);
    res.status(HttpStatusCodes.OK).json(notice);
  } catch (error) {
    next(error);
  }
}
