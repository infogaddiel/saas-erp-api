'use strict';

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => String(typeof t === 'object' && t.tableName ? t.tableName : t).toLowerCase());
  return normalized.includes(String(tableName).toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const receiptsExists = await hasTable(queryInterface, 'receipts');
    if (!receiptsExists) {
      await queryInterface.createTable('receipts', {
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
        receipt_date: {
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
          defaultValue: 'cash',
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
        transaction_reference: {
          type: Sequelize.STRING(255),
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
    const receiptsExists = await hasTable(queryInterface, 'receipts');
    if (receiptsExists) {
      await queryInterface.dropTable('receipts');
    }
  },
};
