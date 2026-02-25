import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ContractItem extends Model {
  public id!: number;
  public contract_id!: number;
  public item_id!: number;
  public asset_id!: number | null;
  public quantity!: number;
  public unit_price!: number;
  public billing_frequency!: 'One-time' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  public is_renewable!: boolean;
}

ContractItem.init(
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
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'items',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    billing_frequency: {
      type: DataTypes.ENUM('One-time', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'),
      allowNull: false,
    },
    is_renewable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'contract_items',
    timestamps: false,
  }
);

export default ContractItem;
