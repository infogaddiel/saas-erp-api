import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ContractInvoice extends Model {
  public id!: number;
  public contract_id!: number;
  public scheduled_billing_date!: Date;
  public amount_to_bill!: number;
  public invoice_reference!: string | null;
  public billing_status!: 'Pending' | 'Invoiced' | 'Paid';
}

ContractInvoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contract_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contracts',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    scheduled_billing_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount_to_bill: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    invoice_reference: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    billing_status: {
      type: DataTypes.ENUM('Pending', 'Invoiced', 'Paid'),
      allowNull: false,
      defaultValue: 'Pending',
    },
  },
  {
    sequelize,
    tableName: 'contract_invoices',
    timestamps: false,
  }
);

export default ContractInvoice;
