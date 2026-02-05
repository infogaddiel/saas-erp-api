'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = ['Super Admin', 'Admin', 'Staff', 'Technician'];
    const companyID = 1;

    for (const type of roles) {
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE type = ?',
        { replacements: [type] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert('roles', [{
          type,
          is_active: true,
          company_id: companyID,
          created_at: new Date(),
          updated_at: new Date(),
        }], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};