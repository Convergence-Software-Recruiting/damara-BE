import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import { NOTICE_TYPES, NoticeType } from "../types/notice";

export interface NoticeAttributes {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  type: NoticeType;
  isPinned: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type NoticeCreationAttributes = Optional<
  NoticeAttributes,
  "id" | "summary" | "type" | "isPinned" | "createdAt" | "updatedAt"
>;

export class NoticeModel
  extends Model<NoticeAttributes, NoticeCreationAttributes>
  implements NoticeAttributes
{
  public id!: string;
  public title!: string;
  public summary!: string | null;
  public content!: string;
  public type!: NoticeType;
  public isPinned!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

NoticeModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    summary: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...NOTICE_TYPES),
      allowNull: false,
      defaultValue: "service",
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_pinned",
    },
  },
  {
    sequelize,
    tableName: "notices",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["type", "created_at"],
      },
      {
        fields: ["is_pinned", "created_at"],
      },
    ],
  }
);

export default NoticeModel;
