import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Company extends Model {
  public id!: number;
  public name!: string;
  public address!: string | null;
  public branch1_address!: string | null;
  public branch2_address!: string | null;
  public branch3_address!: string | null;
  public contract!: string | null;
  public website_url!: string | null;
  public logo!: string | null;
  public email!: string | null;
  public mobile!: string | null;
  public other_mobile!: string | null;
  public status!: boolean;
  public license_number!: string | null;
  public license_expiry_date!: Date | null;
  public license_image!: string | null;
  public license_type!: string | null;
  public license_status!: string | null;
  public license_renewal_date!: Date | null;
  public license_renewal_amount!: number | null;
  public license_renewal_status!: string | null;
  public gst_number!: string | null;
  public gst_certificate!: string | null;
  public gst_certificate_expiry_date!: Date | null;
  public gst_certificate_status!: string | null;
  public gst_certificate_renewal_date!: Date | null;
  public gst_certificate_renewal_amount!: number | null;
  public gst_certificate_renewal_status!: string | null;
  public pan_number!: string | null;
  public pan_certificate!: string | null;
  public pan_certificate_expiry_date!: Date | null;
  public pan_certificate_status!: string | null;
  public pan_certificate_renewal_date!: Date | null;
  public pan_certificate_renewal_amount!: number | null;
  public pan_certificate_renewal_status!: string | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Company.init(
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
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    other_mobile: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    branch1_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'branch1_adress',
    },
    branch2_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'branch2_adress',
    },
    branch3_address: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'branch3_adress',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contract: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    website_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    license_expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    license_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    license_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    license_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    license_renewal_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    license_renewal_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    license_renewal_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gst_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gst_certificate: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    gst_certificate_expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gst_certificate_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    gst_certificate_renewal_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    gst_certificate_renewal_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    gst_certificate_renewal_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pan_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pan_certificate: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pan_certificate_expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pan_certificate_status: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pan_certificate_renewal_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pan_certificate_renewal_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    pan_certificate_renewal_status: {
      type: DataTypes.STRING(100),
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
    tableName: 'company',
    timestamps: false,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default Company;
