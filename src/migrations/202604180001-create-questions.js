'use strict';

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => String(typeof t === 'object' && t.tableName ? t.tableName : t).toLowerCase());
  return normalized.includes(String(tableName).toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const questionsExists = await hasTable(queryInterface, 'questions');
    if (!questionsExists) {
      await queryInterface.createTable('questions', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        question: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: null,
        },
        is_deleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
    }
  },

  async down(queryInterface) {
    const questionsExists = await hasTable(queryInterface, 'questions');
    if (questionsExists) {
      await queryInterface.dropTable('questions');
    }
  },
};
