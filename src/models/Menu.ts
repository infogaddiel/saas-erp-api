import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Menu extends Model {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public status!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Menu.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'menus',
    timestamps: false,
  }
);

export default Menu;
