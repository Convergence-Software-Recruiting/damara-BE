import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import PostModel from "./Post";
import UserModel from "./User";
import {
  POST_EXCEPTION_STATUSES,
  POST_EXCEPTION_SEVERITIES,
  POST_EXCEPTION_TYPES,
  PostExceptionSeverity,
  PostExceptionStatus,
  PostExceptionType,
} from "../types/post-exception";

export interface PostExceptionAttributes {
  id: string;
  postId: string;
  reporterId: string;
  type: PostExceptionType;
  status: PostExceptionStatus;
  reason: string;
  displayTitle: string;
  displayMessage: string;
  severity: PostExceptionSeverity;
  oldPrice: number | null;
  newPrice: number | null;
  affectedQuantity: number | null;
  metadata: Record<string, unknown> | null;
  resolutionNote: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PostExceptionCreationAttributes = Optional<
  PostExceptionAttributes,
  | "id"
  | "status"
  | "displayTitle"
  | "displayMessage"
  | "severity"
  | "oldPrice"
  | "newPrice"
  | "affectedQuantity"
  | "metadata"
  | "resolutionNote"
  | "createdAt"
  | "updatedAt"
>;

export class PostExceptionModel
  extends Model<PostExceptionAttributes, PostExceptionCreationAttributes>
  implements PostExceptionAttributes
{
  public id!: string;
  public postId!: string;
  public reporterId!: string;
  public type!: PostExceptionType;
  public status!: PostExceptionStatus;
  public reason!: string;
  public displayTitle!: string;
  public displayMessage!: string;
  public severity!: PostExceptionSeverity;
  public oldPrice!: number | null;
  public newPrice!: number | null;
  public affectedQuantity!: number | null;
  public metadata!: Record<string, unknown> | null;
  public resolutionNote!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PostExceptionModel.init(
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
    type: {
      type: DataTypes.ENUM(...POST_EXCEPTION_TYPES),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...POST_EXCEPTION_STATUSES),
      allowNull: false,
      defaultValue: "open",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    displayTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: "display_title",
    },
    displayMessage: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: "display_message",
    },
    severity: {
      type: DataTypes.ENUM(...POST_EXCEPTION_SEVERITIES),
      allowNull: false,
      defaultValue: "warning",
    },
    oldPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      field: "old_price",
    },
    newPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      field: "new_price",
    },
    affectedQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: "affected_quantity",
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    resolutionNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
      field: "resolution_note",
    },
  },
  {
    sequelize,
    tableName: "post_exceptions",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["post_id", "status", "created_at"],
      },
      {
        fields: ["reporter_id", "created_at"],
      },
      {
        fields: ["type"],
      },
    ],
  }
);

PostModel.hasMany(PostExceptionModel, {
  foreignKey: "postId",
  as: "exceptions",
});

PostExceptionModel.belongsTo(PostModel, {
  foreignKey: "postId",
  as: "post",
});

PostExceptionModel.belongsTo(UserModel, {
  foreignKey: "reporterId",
  as: "reporter",
});

export default PostExceptionModel;
