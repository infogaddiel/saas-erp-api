'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const companies = [
      { name: 'gaddiel', company_code: 'GAD' },
      { name: 'testing', company_code: 'TST' },
    ];

    for (const company of companies) {
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM company WHERE name = ?',
        { replacements: [company.name] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert('company', [{
          name: company.name,
          company_code: company.company_code,
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
