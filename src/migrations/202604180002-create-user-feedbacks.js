'use strict';

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => String(typeof t === 'object' && t.tableName ? t.tableName : t).toLowerCase());
  return normalized.includes(String(tableName).toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const userFeedbacksExists = await hasTable(queryInterface, 'user_feedbacks');
    if (!userFeedbacksExists) {
      await queryInterface.createTable('user_feedbacks', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        question_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'questions',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        feedback: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      });

      await queryInterface.addIndex('user_feedbacks', ['user_id']);
      await queryInterface.addIndex('user_feedbacks', ['question_id']);
      await queryInterface.addIndex('user_feedbacks', ['deleted_at']);
    }
  },

  async down(queryInterface) {
    const userFeedbacksExists = await hasTable(queryInterface, 'user_feedbacks');
    if (userFeedbacksExists) {
      await queryInterface.dropTable('user_feedbacks');
    }
  },
};
