// src/repos/NoShowReportRepo.ts

import { Op } from "sequelize";
import NoShowReportModel, {
  NoShowReportCreationAttributes,
  NoShowReportStatus,
} from "../models/NoShowReport";
import PostModel from "../models/Post";
import UserModel from "../models/User";
import { RouteError } from "../common/util/route-errors";
import HttpStatusCodes from "../common/constants/HttpStatusCodes";

export const NoShowReportRepo = {
  async create(data: NoShowReportCreationAttributes) {
    const report = await NoShowReportModel.create(data);
    return report.get();
  },

  async findById(id: string) {
    const report = await NoShowReportModel.findByPk(id, {
      include: [
        {
          model: PostModel,
          as: "post",
          attributes: ["id", "title", "authorId", "status"],
        },
        {
          model: UserModel,
          as: "reporter",
          attributes: ["id", "nickname", "studentId"],
        },
        {
          model: UserModel,
          as: "reportedUser",
          attributes: ["id", "nickname", "studentId", "trustScore"],
        },
      ],
    });

    return report ? report.get() : null;
  },

  async findOpenReport(postId: string, reportedUserId: string) {
    const report = await NoShowReportModel.findOne({
      where: {
        postId,
        reportedUserId,
        status: {
          [Op.in]: ["pending", "confirmed"],
        },
      },
    });

    return report ? report.get() : null;
  },

  async updateStatus(
    id: string,
    status: Extract<NoShowReportStatus, "confirmed" | "rejected" | "cancelled">
  ) {
    const report = await NoShowReportModel.findByPk(id);
    if (!report) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NO_SHOW_REPORT_NOT_FOUND");
    }

    await report.update({
      status,
      resolvedAt: new Date(),
    });

    return report.get();
  },

  async listByPostId(postId: string, limit = 20, offset = 0) {
    const reports = await NoShowReportModel.findAll({
      where: { postId },
      include: [
        {
          model: UserModel,
          as: "reporter",
          attributes: ["id", "nickname", "studentId"],
        },
        {
          model: UserModel,
          as: "reportedUser",
          attributes: ["id", "nickname", "studentId", "trustScore"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return reports.map((report) => report.get());
  },
};
