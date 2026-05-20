// src/models/Notification.ts

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import UserModel from "./User";
import PostModel from "./Post";
import ChatRoomModel from "./ChatRoom";
import {
  STORED_NOTIFICATION_TYPES,
  StoredNotificationType,
} from "../types/notification";

// ----------------------------
// TypeScript 타입 정의
// ----------------------------

/**
 * DB 컬럼 기반 attributes
 */
export interface NotificationAttributes {
  id: string;
  userId: string; // users.id와 외래키 관계
  type: StoredNotificationType;
  title: string;
  message: string;
  postId: string | null; // posts.id와 외래키 관계 (nullable)
  chatRoomId: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create 시 필요한 값
 */
export type NotificationCreationAttributes = Optional<
  NotificationAttributes,
  | "id"
  | "postId"
  | "chatRoomId"
  | "actionUrl"
  | "isRead"
  | "createdAt"
  | "updatedAt"
>;

/**
 * Sequelize 모델 타입 선언
 */
export class NotificationModel
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  public id!: string;
  public userId!: string;
  public type!: StoredNotificationType;
  public title!: string;
  public message!: string;
  public postId!: string | null;
  public chatRoomId!: string | null;
  public actionUrl!: string | null;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// ----------------------------
// Sequelize 모델 초기화
// ----------------------------
NotificationModel.init(
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
    type: {
      type: DataTypes.ENUM(...STORED_NOTIFICATION_TYPES),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "post_id",
      references: {
        model: PostModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    chatRoomId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      field: "chat_room_id",
      references: {
        model: ChatRoomModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
      field: "action_url",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_read",
    },
  },
  {
    sequelize,
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id", "is_read"], // 사용자별 읽지 않은 알림 조회 최적화
      },
      {
        fields: ["user_id", "created_at"], // 사용자별 알림 목록 조회 최적화
      },
    ],
  }
);

// ----------------------------
// 관계 설정 (Associations)
// ----------------------------
NotificationModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

NotificationModel.belongsTo(PostModel, {
  foreignKey: "postId",
  as: "post",
});

NotificationModel.belongsTo(ChatRoomModel, {
  foreignKey: "chatRoomId",
  as: "chatRoom",
});

export default NotificationModel;
