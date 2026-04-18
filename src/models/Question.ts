import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Question extends Model {
  public id!: number;
  public question!: string;
  public type!: string | null;
  public is_deleted!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'questions',
    timestamps: true,
    underscored: true,
    defaultScope: {
      where: {
        is_deleted: false,
      },
    },
  }
);

export default Question;
