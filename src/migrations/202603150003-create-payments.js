'use strict';

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => String(typeof t === 'object' && t.tableName ? t.tableName : t).toLowerCase());
  return normalized.includes(String(tableName).toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const paymentsExists = await hasTable(queryInterface, 'payments');
    if (!paymentsExists) {
      await queryInterface.createTable('payments', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        pay_to: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        payment_date: {
          type: Sequelize.DATEONLY,
          allowNull: false,
        },
        amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        payment_method: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        transaction_reference: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
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
    const paymentsExists = await hasTable(queryInterface, 'payments');
    if (paymentsExists) {
      await queryInterface.dropTable('payments');
    }
  },
};
