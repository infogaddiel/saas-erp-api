import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Customer extends Model {
  public id!: number;
  public name!: string;
  public mobile!: string | null;
  public email!: string | null;
  public address!: string | null;
  public ship_address!: string | null;
  public type!: 'Individual' | 'Company';
  public customer_type_id!: number | null;
  public status!: boolean;
  public created_by!: number | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: 'customers_mobile_key',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ship_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
     gst_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pan_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('Individual', 'Company'),
      allowNull: false,
    },
    customer_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'customer_type',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: false,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default Customer;
