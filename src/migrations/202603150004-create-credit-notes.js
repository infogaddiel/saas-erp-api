'use strict';

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => String(typeof t === 'object' && t.tableName ? t.tableName : t).toLowerCase());
  return normalized.includes(String(tableName).toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const creditNotesExists = await hasTable(queryInterface, 'credit_notes');
    if (!creditNotesExists) {
      await queryInterface.createTable('credit_notes', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        customer_name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        invoice_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'invoices',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        issue_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        reason: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        status: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
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
    }
  },

  async down(queryInterface) {
    const creditNotesExists = await hasTable(queryInterface, 'credit_notes');
    if (creditNotesExists) {
      await queryInterface.dropTable('credit_notes');
    }
  },
};
