import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ServiceSchedule extends Model {
  public id!: number;
  public contract_item_id!: number;
  public planned_date!: Date;
  public actual_date!: Date | null;
  public service_status!: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';
  public technician_id!: number | null;
  public service_notes!: string | null;
}

ServiceSchedule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contract_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contract_items',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    planned_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    actual_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    service_status: {
      type: DataTypes.ENUM('Scheduled', 'In-Progress', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Scheduled',
    },
    technician_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    service_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'service_schedules',
    timestamps: false,
  }
);

export default ServiceSchedule;
