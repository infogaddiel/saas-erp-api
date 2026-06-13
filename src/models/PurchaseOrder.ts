import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export const PURCHASE_ORDER_STATUSES = ['Draft', 'Pending', 'Approved', 'Received', 'Cancelled'] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

class PurchaseOrder extends Model {
  public id!: number;
  public po_number!: string;
  public vendor_id!: number;
  public order_date!: string;
  public expected_delivery!: string | null;
  public total_amount!: number;
  public status!: PurchaseOrderStatus;
  public items_description!: string | null;
  public notes!: string | null;
  public created_by!: number | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PurchaseOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expected_delivery: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...PURCHASE_ORDER_STATUSES),
      allowNull: false,
      defaultValue: 'Draft',
    },
    items_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default PurchaseOrder;
