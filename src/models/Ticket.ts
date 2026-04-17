import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Ticket extends Model {
  public id!: number;
  public ticket_number!: string | null;
  public customer_id!: number;
  public status_id!: number;
  public service_address!: string;
  public priority!: string;
  public service_type!: string;
  public assigned_technician_id!: number | null;
  public scheduled_date!: Date | null;
  public equipment_type!: string | null;
  public equipment_model!: string | null;
  public issue_description!: string;
  public created_by!: number | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Ticket.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket_statuses',
        key: 'id',
      },
    },
    service_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Medium',
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    assigned_technician_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    equipment_type: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    equipment_model: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    issue_description: {
      type: DataTypes.TEXT,
      allowNull: false,
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
    tableName: 'tickets',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
  }
);

export default Ticket;
