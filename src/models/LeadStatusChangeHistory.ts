import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class LeadStatusChangeHistory extends Model {
  public id!: number;
  public lead_id!: number;
  public status_id!: number;
  public changed_by!: number | null;
  public changed_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LeadStatusChangeHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id',
      },
    },
    status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'lead_statuses',
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
    tableName: 'lead_status_change_histories',
    timestamps: true,
    underscored: true,
  }
);

export default LeadStatusChangeHistory;
