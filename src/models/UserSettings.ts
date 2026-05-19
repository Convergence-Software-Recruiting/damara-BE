import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import UserModel from "./User";

export interface UserSettingsAttributes {
  id: string;
  userId: string;
  pushEnabled: boolean;
  chatNotificationEnabled: boolean;
  postNotificationEnabled: boolean;
  marketingNotificationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserSettingsCreationAttributes = Optional<
  UserSettingsAttributes,
  | "id"
  | "pushEnabled"
  | "chatNotificationEnabled"
  | "postNotificationEnabled"
  | "marketingNotificationEnabled"
  | "quietHoursEnabled"
  | "quietHoursStart"
  | "quietHoursEnd"
  | "createdAt"
  | "updatedAt"
>;

export class UserSettingsModel
  extends Model<UserSettingsAttributes, UserSettingsCreationAttributes>
  implements UserSettingsAttributes
{
  public id!: string;
  public userId!: string;
  public pushEnabled!: boolean;
  public chatNotificationEnabled!: boolean;
  public postNotificationEnabled!: boolean;
  public marketingNotificationEnabled!: boolean;
  public quietHoursEnabled!: boolean;
  public quietHoursStart!: string;
  public quietHoursEnd!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserSettingsModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: "user_id",
      references: {
        model: UserModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    pushEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "push_enabled",
    },
    chatNotificationEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "chat_notification_enabled",
    },
    postNotificationEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "post_notification_enabled",
    },
    marketingNotificationEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "marketing_notification_enabled",
    },
    quietHoursEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "quiet_hours_enabled",
    },
    quietHoursStart: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "23:00",
      field: "quiet_hours_start",
    },
    quietHoursEnd: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: "08:00",
      field: "quiet_hours_end",
    },
  },
  {
    sequelize,
    tableName: "user_settings",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id"],
      },
    ],
  }
);

UserModel.hasOne(UserSettingsModel, {
  foreignKey: "userId",
  as: "settings",
});

UserSettingsModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "user",
});

export default UserSettingsModel;
