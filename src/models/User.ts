import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Company from './Company';

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string | null;
  public profile_image!: string | null;
  public mobile!: string;
  public password!: string;
  public company_id!: number | null;
  public role_id!: number | null;
  public blocked!: boolean;
  public mobile_otp!: string | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
} 

User.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    profile_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: 'users_mobile_key',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Company,
        key: 'id',
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    blocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    mobile_otp: {
      type: DataTypes.STRING(6),
      allowNull: true,
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
    tableName: 'users',
    timestamps: false,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default User;


