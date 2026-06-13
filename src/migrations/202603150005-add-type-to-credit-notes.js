'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('credit_notes', 'type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'credit',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('credit_notes', 'type');
  },
};
