import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export type CreditDebitNoteType = 'credit' | 'debit';

class CreditNote extends Model {
  public id!: number;
  public type!: CreditDebitNoteType;
  public customer_name!: string;
  public crn_number!: string;
  public invoice_id!: number | null;
  public issue_date!: string;
  public amount!: number;
  public reason!: string;
  public status!: string;
  public description!: string | null;
  public notes!: string | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CreditNote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    crn_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'credit',
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
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
    tableName: 'credit_notes',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default CreditNote;
