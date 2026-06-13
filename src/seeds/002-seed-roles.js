'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      { type: 'Super Admin', level: 1 },
      { type: 'Admin', level: 2 },
      { type: 'Staff', level: 3 },
      { type: 'Technician', level: 4 },
    ];
    const companyID = 1;

    for (const role of roles) {
      const { type, level } = role;
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE type = ?',
        { replacements: [type] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert('roles', [{
          type,
          level,
          is_active: true,
          company_id: companyID,
          created_at: new Date(),
          updated_at: new Date(),
        }], {});
      } else {
        await queryInterface.bulkUpdate(
          'roles',
          {
            level,
            updated_at: new Date(),
          },
          { type }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
