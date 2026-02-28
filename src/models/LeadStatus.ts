import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class LeadStatus extends Model {
  public id!: number;
  public name!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LeadStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    tableName: 'lead_statuses',
    timestamps: true,
    underscored: true,
  }
);

export default LeadStatus;
