import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Contract extends Model {
  public id!: number;
  public name!: string;
  public description?: string;
  public customer_id!: number;
  public project_id!: number | null;
  public contract_number!: string;
  public contract_type!: 'AMC' | 'Service' | 'Subscription';
  public status!: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  public start_date!: Date;
  public end_date!: Date;
  public total_value!: number;
  public currency!: string;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
}

Contract.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: 'Untitled Contract',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    contract_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    contract_type: {
      type: DataTypes.ENUM('AMC', 'Service', 'Subscription'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Active', 'Expired', 'Terminated'),
      allowNull: false,
      defaultValue: 'Draft',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'contracts',
    timestamps: false,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
    validate: {
      endDateAfterStartDate() {
        if (this.end_date && this.start_date && this.end_date < this.start_date) {
          throw new Error('end_date must be greater than or equal to start_date');
        }
      },
    },
  }
);

export default Contract;
