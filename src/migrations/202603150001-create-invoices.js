'use strict';

const hasTable = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => String(typeof t === 'object' && t.tableName ? t.tableName : t).toLowerCase());
  return normalized.includes(String(tableName).toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const invoicesExists = await hasTable(queryInterface, 'invoices');
    if (!invoicesExists) {
      await queryInterface.createTable('invoices', {
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
        payment_status: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        invoice_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        due_date: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        sub_total: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        tax_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        total_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        amount_paid: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
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

    const lineItemsExists = await hasTable(queryInterface, 'invoice_line_items');
    if (!lineItemsExists) {
      await queryInterface.createTable('invoice_line_items', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        invoice_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'invoices',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        item_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'items',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        unit: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        price: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        quantity: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        discount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        discount_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        tax: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        tax_amount: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
        },
        final_price: {
          type: Sequelize.DECIMAL(12, 2),
          allowNull: false,
          defaultValue: 0,
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
    const lineItemsExists = await hasTable(queryInterface, 'invoice_line_items');
    if (lineItemsExists) {
      await queryInterface.dropTable('invoice_line_items');
    }

    const invoicesExists = await hasTable(queryInterface, 'invoices');
    if (invoicesExists) {
      await queryInterface.dropTable('invoices');
    }
  },
};

