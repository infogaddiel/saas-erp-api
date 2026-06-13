import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Project extends Model {
  public id!: number;
  public project_number!: string;
  public project_name!: string;
  public customer_id!: number;
  public project_manager!: string | null;
  public start_date!: Date;
  public end_date!: Date | null;
  public budget!: number;
  public status!: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  public description!: string | null;
  public notes!: string | null;
  public created_by!: number | null;
  public deleted_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    project_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    project_manager: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'),
      allowNull: false,
      defaultValue: 'Planning',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notes: {
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
    tableName: 'projects',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        deleted_at: null,
      },
    },
    validate: {
      endDateAfterStartDate() {
        if (this.end_date && this.start_date && this.end_date < this.start_date) {
          throw new Error('end_date must be greater than or equal to start_date');
        }
      },
    },
  }
);

export default Project;
