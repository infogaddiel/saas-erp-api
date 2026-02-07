'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const companies = ['gaddiel', 'testing'];

    for (const name of companies) {
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM company WHERE name = ?',
        { replacements: [name] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert('company', [{
          name,
          mobile: '9632145879',
          email: 'company@gaddiel.com',
          address: null,
          contract: null,
          created_at: new Date(),
          updated_at: new Date(),
        }], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('company', null, {});
  }
};