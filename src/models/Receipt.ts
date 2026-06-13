import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Receipt extends Model {
  public id!: number;
  public customer_name!: string;
  public receipt_date!: string;
  public receipt_number!: string;
  public amount!: number;
  public payment_method!: string;
  public invoice_id!: number | null;
  public transaction_reference!: string | null;
  public notes!: string | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Receipt.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    receipt_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    receipt_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'cash',
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    transaction_reference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'receipts',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default Receipt;
