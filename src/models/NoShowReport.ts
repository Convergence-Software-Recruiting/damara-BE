// src/models/NoShowReport.ts

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import PostModel from "./Post";
import UserModel from "./User";

export const NO_SHOW_REPORT_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
] as const;

export type NoShowReportStatus = (typeof NO_SHOW_REPORT_STATUSES)[number];

export interface NoShowReportAttributes {
  id: string;
  postId: string;
  reporterId: string;
  reportedUserId: string;
  status: NoShowReportStatus;
  reason: string | null;
  resolvedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NoShowReportCreationAttributes = Optional<
  NoShowReportAttributes,
  "id" | "status" | "reason" | "resolvedAt" | "createdAt" | "updatedAt"
>;

export class NoShowReportModel
  extends Model<NoShowReportAttributes, NoShowReportCreationAttributes>
  implements NoShowReportAttributes
{
  public id!: string;
  public postId!: string;
  public reporterId!: string;
  public reportedUserId!: string;
  public status!: NoShowReportStatus;
  public reason!: string | null;
  public resolvedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NoShowReportModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "post_id",
      references: {
        model: PostModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "reporter_id",
      references: {
        model: UserModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    reportedUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "reported_user_id",
      references: {
        model: UserModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.ENUM(...NO_SHOW_REPORT_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "resolved_at",
    },
  },
  {
    sequelize,
    tableName: "no_show_reports",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["post_id", "status"],
      },
      {
        fields: ["reported_user_id", "status"],
      },
      {
        fields: ["reporter_id", "created_at"],
      },
    ],
  }
);

NoShowReportModel.belongsTo(PostModel, {
  foreignKey: "postId",
  as: "post",
});

NoShowReportModel.belongsTo(UserModel, {
  foreignKey: "reporterId",
  as: "reporter",
});

NoShowReportModel.belongsTo(UserModel, {
  foreignKey: "reportedUserId",
  as: "reportedUser",
});

PostModel.hasMany(NoShowReportModel, {
  foreignKey: "postId",
  as: "noShowReports",
});

UserModel.hasMany(NoShowReportModel, {
  foreignKey: "reporterId",
  as: "submittedNoShowReports",
});

UserModel.hasMany(NoShowReportModel, {
  foreignKey: "reportedUserId",
  as: "receivedNoShowReports",
});

export default NoShowReportModel;
