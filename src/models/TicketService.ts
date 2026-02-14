import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TicketService extends Model {
  public id!: number;
  public ticket_id!: number;
  public customer_id!: number;
  public email!: string | null;
  public phone!: string | null;
  public service_date!: Date | null;
  public service_address!: string;
  public service_type!: string;
  public technician_name!: string | null;
  public equipment_type!: string | null;
  public equipment_model!: string | null;
  public work_performed!: string | null;
  public parts_used!: string | null;
  public labor_hours!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TicketService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tickets',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    service_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    service_address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    service_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Repair',
    },
    technician_name: {
      type: DataTypes.STRING(255),
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
    work_performed: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parts_used: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    labor_hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'ticket_services',
    timestamps: true,
    underscored: true,
  }
);

export default TicketService;
