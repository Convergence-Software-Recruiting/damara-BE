import { Request, Response, NextFunction } from "express";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { FaqService } from "../services/FaqService";

function parseInteger(value: unknown, fallback: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getFaqs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await FaqService.listFaqs({
      limit: parseInteger(req.query.limit, 20),
      offset: parseInteger(req.query.offset, 0),
      category:
        typeof req.query.category === "string"
          ? req.query.category
          : undefined,
    });

    res.status(HttpStatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
}
