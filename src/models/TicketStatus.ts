import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class TicketStatus extends Model {
  public id!: number;
  public name!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

TicketStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'ticket_statuses',
    timestamps: true,
    underscored: true,
  }
);

export default TicketStatus;
