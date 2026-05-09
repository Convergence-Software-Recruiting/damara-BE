// src/models/TrustEvent.ts

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import UserModel from "./User";
import PostModel from "./Post";

export const TRUST_EVENT_TYPES = [
  "post_completed_author",
  "post_completed_participant",
  "post_cancelled_by_author",
  "post_deleted_by_author",
  "participant_cancelled",
  "participant_no_show",
  "agreement_confirmed",
  "manual_adjustment",
] as const;

export type TrustEventType = (typeof TRUST_EVENT_TYPES)[number];

export interface TrustEventAttributes {
  id: string;
  userId: string;
  postId: string | null;
  actorUserId: string | null;
  type: TrustEventType;
  scoreChange: number;
  previousScore: number;
  nextScore: number;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TrustEventCreationAttributes = Optional<
  TrustEventAttributes,
  "id" | "postId" | "actorUserId" | "reason" | "metadata" | "createdAt" | "updatedAt"
>;

export class TrustEventModel
  extends Model<TrustEventAttributes, TrustEventCreationAttributes>
  implements TrustEventAttributes
{
  public id!: string;
  public userId!: string;
  public postId!: string | null;
  public actorUserId!: string | null;
  public type!: TrustEventType;
  public scoreChange!: number;
  public previousScore!: number;
  public nextScore!: number;
  public reason!: string | null;
  public metadata!: Record<string, unknown> | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TrustEventModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: UserModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "post_id",
      references: {
        model: PostModel,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    actorUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "actor_user_id",
      references: {
        model: UserModel,
        key: "id",
      },
      onDelete: "SET NULL",
    },
    type: {
      type: DataTypes.ENUM(...TRUST_EVENT_TYPES),
      allowNull: false,
    },
    scoreChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "score_change",
    },
    previousScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "previous_score",
    },
    nextScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "next_score",
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "trust_events",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id", "created_at"],
      },
      {
        fields: ["post_id"],
      },
      {
        fields: ["type"],
      },
    ],
  }
);

UserModel.hasMany(TrustEventModel, {
  foreignKey: "userId",
  as: "trustEvents",
});

TrustEventModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

TrustEventModel.belongsTo(UserModel, {
  foreignKey: "actorUserId",
  as: "actor",
});

PostModel.hasMany(TrustEventModel, {
  foreignKey: "postId",
  as: "trustEvents",
});

TrustEventModel.belongsTo(PostModel, {
  foreignKey: "postId",
  as: "post",
});

export default TrustEventModel;
