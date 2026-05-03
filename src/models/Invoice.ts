import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Invoice extends Model {
  public id!: number;
  public customer_name!: string;
  public invoice_number!: string;
  public payment_status!: string | null;
  public invoice_date!: string | null;
  public due_date!: string | null;
  public sub_total!: number;
  public tax_amount!: number;
  public total_amount!: number;
  public amount_paid!: number;
  public notes!: string | null;
  public created_by!: number | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sub_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    amount_paid: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default Invoice;

