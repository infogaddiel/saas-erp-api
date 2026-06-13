import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TicketStatusHistory extends Model {
  public id!: number;
  public ticket_id!: number;
  public status_id!: number;
  public changed_by!: number | null;
  public changed_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TicketStatusHistory.init(
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
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket_statuses',
        key: 'id',
      },
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    changed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ticket_status_histories',
    timestamps: true,
    underscored: true,
  }
);

export default TicketStatusHistory;
