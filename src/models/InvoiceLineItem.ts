import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class InvoiceLineItem extends Model {
  public id!: number;
  public invoice_id!: number;
  public item_id!: number;
  public unit!: number;
  public price!: number;
  public quantity!: number;
  public discount!: number;
  public discount_amount!: number;
  public tax!: number;
  public tax_amount!: number;
  public final_price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InvoiceLineItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'items',
        key: 'id',
      },
    },
    unit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    final_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'invoice_line_items',
    timestamps: true,
    underscored: true,
  }
);

export default InvoiceLineItem;

