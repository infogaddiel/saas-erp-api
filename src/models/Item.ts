import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Item extends Model {
  public id!: number;
  public item_code!: string;
  public item_name!: string;
  public description!: string | null;
  public type!: string;
  public category!: string;
  public unit_price!: number;
  public gst_percentage!: number;
  public unit!: string;
  public stock_quantity!: number;
  public notes!: string | null;
  public status!: boolean;
  public created_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Item.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    item_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    gst_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 18.0,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'items',
    timestamps: true,
    underscored: true,
  }
);

export default Item;
