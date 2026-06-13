import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class CustomerType extends Model {
  public id!: number;
  public name!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CustomerType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: 'customer_type_name_key',
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
    tableName: 'customer_type',
    timestamps: false,
  }
);

export default CustomerType;
