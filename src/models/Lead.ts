import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Lead extends Model {
  public id!: number;
  public title_of_lead!: string;
  public contact_person!: string;
  public company_name!: string | null;
  public contact_no!: string;
  public address!: string | null;
  public lead_source!: string | null;
  public lead_status_id!: number;
  public product_required!: string | null;
  public created_by!: number | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Lead.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title_of_lead: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contact_person: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contact_no: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lead_source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lead_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lead_statuses',
        key: 'id',
      },
    },
    product_required: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'leads',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default Lead;
