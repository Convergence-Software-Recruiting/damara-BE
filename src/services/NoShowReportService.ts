// src/services/NoShowReportService.ts

import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import NoShowReportModel from "../models/NoShowReport";
import PostModel from "../models/Post";
import PostParticipantModel from "../models/PostParticipant";
import UserModel from "../models/User";
import { NoShowReportRepo } from "../repos/NoShowReportRepo";
import { TrustService } from "./TrustService";
import ENV from "../common/constants/ENV";

interface CreateNoShowReportInput {
  postId: string;
  reporterId: string;
  reportedUserId: string;
  reason?: string | null;
}

async function assertAdminUser(adminUserId?: string | null) {
  if (!adminUserId) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, "ADMIN_USER_ID_REQUIRED");
  }

  if (ENV.AdminUserIds.length === 0) {
    throw new RouteError(
      HttpStatusCodes.FORBIDDEN,
      "ADMIN_USER_IDS_NOT_CONFIGURED"
    );
  }

  const adminUser = await UserModel.findByPk(adminUserId, {
    attributes: ["id"],
  });
  if (!adminUser) {
    throw new RouteError(HttpStatusCodes.NOT_FOUND, "ADMIN_USER_NOT_FOUND");
  }

  if (!ENV.AdminUserIds.includes(adminUserId)) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, "ADMIN_PERMISSION_REQUIRED");
  }
}

export const NoShowReportService = {
  async createReport(input: CreateNoShowReportInput) {
    const post = await PostModel.findByPk(input.postId);
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    const reporter = await UserModel.findByPk(input.reporterId);
    if (!reporter) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "REPORTER_NOT_FOUND");
    }

    const reportedUser = await UserModel.findByPk(input.reportedUserId);
    if (!reportedUser) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "REPORTED_USER_NOT_FOUND");
    }

    if (post.authorId !== input.reporterId) {
      throw new RouteError(
        HttpStatusCodes.FORBIDDEN,
        "ONLY_AUTHOR_CAN_REPORT_NO_SHOW"
      );
    }

    if (input.reporterId === input.reportedUserId) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "CANNOT_REPORT_SELF_NO_SHOW"
      );
    }

    const participant = await PostParticipantModel.findOne({
      where: {
        postId: input.postId,
        userId: input.reportedUserId,
      },
    });

    if (!participant) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "PARTICIPANT_NOT_FOUND");
    }

    if (participant.agreementStatus !== "accepted") {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "AGREEMENT_NOT_ACCEPTED"
      );
    }

    const existingReport = await NoShowReportRepo.findOpenReport(
      input.postId,
      input.reportedUserId
    );
    if (existingReport) {
      throw new RouteError(
        HttpStatusCodes.CONFLICT,
        "NO_SHOW_REPORT_ALREADY_EXISTS"
      );
    }

    return await NoShowReportRepo.create({
      postId: input.postId,
      reporterId: input.reporterId,
      reportedUserId: input.reportedUserId,
      reason:
        input.reason && input.reason.trim() !== ""
          ? input.reason.trim()
          : null,
    });
  },

  async confirmReport(id: string, adminUserId?: string | null) {
    await assertAdminUser(adminUserId);

    const report = await NoShowReportModel.findByPk(id);
    if (!report) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NO_SHOW_REPORT_NOT_FOUND");
    }

    if (report.status === "confirmed") {
      return {
        report: report.get(),
        trustEvent: null,
      };
    }

    if (report.status !== "pending") {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "NO_SHOW_REPORT_NOT_PENDING"
      );
    }

    const updatedReport = await NoShowReportRepo.updateStatus(id, "confirmed");
    const trustEvent = await TrustService.recordParticipantNoShow(
      updatedReport.postId,
      updatedReport.reportedUserId,
      updatedReport.reporterId
    );

    return {
      report: updatedReport,
      trustEvent: {
        ...trustEvent,
        previousGrade: TrustService.calculateTrustGrade(
          trustEvent.previousScore
        ),
        nextGrade: TrustService.calculateTrustGrade(trustEvent.nextScore),
      },
    };
  },

  async rejectReport(id: string, adminUserId?: string | null) {
    await assertAdminUser(adminUserId);

    const report = await NoShowReportModel.findByPk(id);
    if (!report) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NO_SHOW_REPORT_NOT_FOUND");
    }

    if (report.status === "rejected") {
      return report.get();
    }

    if (report.status !== "pending") {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "NO_SHOW_REPORT_NOT_PENDING"
      );
    }

    return await NoShowReportRepo.updateStatus(id, "rejected");
  },

  async cancelReport(
    id: string,
    requesterId?: string | null,
    adminUserId?: string | null
  ) {
    const report = await NoShowReportModel.findByPk(id);
    if (!report) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NO_SHOW_REPORT_NOT_FOUND");
    }

    if (report.status === "cancelled") {
      return report.get();
    }

    if (report.status !== "pending") {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "NO_SHOW_REPORT_NOT_PENDING"
      );
    }

    if (requesterId && requesterId === report.reporterId) {
      return await NoShowReportRepo.updateStatus(id, "cancelled");
    }

    if (requesterId && !adminUserId) {
      throw new RouteError(
        HttpStatusCodes.FORBIDDEN,
        "NO_SHOW_REPORT_CANCEL_FORBIDDEN"
      );
    }

    if (!requesterId && !adminUserId) {
      throw new RouteError(
        HttpStatusCodes.BAD_REQUEST,
        "REQUESTER_OR_ADMIN_USER_ID_REQUIRED"
      );
    }

    await assertAdminUser(adminUserId);
    return await NoShowReportRepo.updateStatus(id, "cancelled");
  },

  async getReport(id: string) {
    const report = await NoShowReportRepo.findById(id);
    if (!report) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "NO_SHOW_REPORT_NOT_FOUND");
    }

    return report;
  },

  async listByPostId(postId: string, limit = 20, offset = 0) {
    const post = await PostModel.findByPk(postId, {
      attributes: ["id"],
    });
    if (!post) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, "POST_NOT_FOUND");
    }

    return await NoShowReportRepo.listByPostId(postId, limit, offset);
  },
};
