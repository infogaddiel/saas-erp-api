'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDefinition = await queryInterface.describeTable('company');

    if (!tableDefinition.company_code) {
      await queryInterface.addColumn('company', 'company_code', {
        type: Sequelize.STRING(3),
        allowNull: true,
        defaultValue: 'GED',
      });
    }
  },

  async down(queryInterface) {
    const tableDefinition = await queryInterface.describeTable('company');

    if (tableDefinition.company_code) {
      await queryInterface.removeColumn('company', 'company_code');
    }
  },
};
