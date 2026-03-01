import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class ProjectFile extends Model {
  public id!: number;
  public project_id!: number;
  public document_name!: string;
  public document_url!: string;
  public document_type!: string | null;
  public notes!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProjectFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    document_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    document_url: {
      type: DataTypes.STRING(2048),
      allowNull: false,
    },
    document_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'project_files',
    timestamps: true,
    underscored: true,
  }
);

export default ProjectFile;
