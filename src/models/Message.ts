// src/models/Message.ts

import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import ChatRoomModel from "./ChatRoom";
import UserModel from "./User";
import { STORED_MESSAGE_TYPES, StoredMessageType } from "../types/chat";

// ----------------------------
// TypeScript 타입 정의
// ----------------------------

/**
 * DB 컬럼 기반 attributes
 * 실제 messages 테이블의 컬럼 스키마를 TypeScript로 옮겨온 타입
 */
export interface MessageAttributes {
  id: string;
  chatRoomId: string; // chat_rooms.id와 외래키 관계
  senderId: string; // users.id와 외래키 관계 (메시지 보낸 사람)
  content: string; // 메시지 내용
  messageType: StoredMessageType; // 메시지 타입
  isRead: boolean; // 읽음 여부
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Create 시 필요한 값(자동 생성되는 id 제거)
 */
export type MessageCreationAttributes = Optional<
  MessageAttributes,
  "id" | "isRead" | "createdAt" | "updatedAt"
>;

/**
 * Sequelize 모델 타입 선언
 */
export class MessageModel
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  public id!: string;
  public chatRoomId!: string;
  public senderId!: string;
  public content!: string;
  public messageType!: StoredMessageType;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// ----------------------------
// Sequelize 모델 초기화
// ----------------------------
MessageModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    chatRoomId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "chat_room_id",
      references: {
        model: ChatRoomModel,
        key: "id",
      },
      onDelete: "CASCADE", // 채팅방 삭제 시 메시지도 삭제
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "sender_id",
      references: {
        model: UserModel,
        key: "id",
      },
      onDelete: "CASCADE", // 사용자 삭제 시 메시지도 삭제
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM(...STORED_MESSAGE_TYPES),
      allowNull: false,
      defaultValue: "text",
      field: "message_type",
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
    tableName: "messages",
    timestamps: true,
    underscored: true,
  }
);

// ----------------------------
// 관계 설정 (Associations)
// ----------------------------
MessageModel.belongsTo(ChatRoomModel, {
  foreignKey: "chatRoomId",
  as: "chatRoom", // MessageModel.chatRoom으로 접근 가능
});

MessageModel.belongsTo(UserModel, {
  foreignKey: "senderId",
  as: "sender", // MessageModel.sender로 접근 가능
});

ChatRoomModel.hasMany(MessageModel, {
  foreignKey: "chatRoomId",
  as: "messages", // ChatRoomModel.messages로 접근 가능
});

UserModel.hasMany(MessageModel, {
  foreignKey: "senderId",
  as: "sentMessages", // UserModel.sentMessages로 접근 가능
});

export default MessageModel;
