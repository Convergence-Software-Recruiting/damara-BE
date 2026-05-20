import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../db";
import { FAQ_CATEGORIES, FaqCategory } from "../types/faq";

export interface FaqAttributes {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FaqCreationAttributes = Optional<
  FaqAttributes,
  "id" | "category" | "order" | "isActive" | "createdAt" | "updatedAt"
>;

export class FaqModel
  extends Model<FaqAttributes, FaqCreationAttributes>
  implements FaqAttributes
{
  public id!: string;
  public category!: FaqCategory;
  public question!: string;
  public answer!: string;
  public order!: number;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FaqModel.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    category: {
      type: DataTypes.ENUM(...FAQ_CATEGORIES),
      allowNull: false,
      defaultValue: "etc",
    },
    question: {
      type: DataTypes.STRING(300),
      allowNull: false,
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "sort_order",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    sequelize,
    tableName: "faqs",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["category", "is_active", "sort_order"],
      },
      {
        fields: ["is_active", "sort_order"],
      },
    ],
  }
);

export default FaqModel;
