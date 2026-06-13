'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const customerTypes = [
      'Commercial',
      'Residential',
      'Industrial',
      'Institutional',
      'Healthcare',
      'Hospitality',
      'Retail/ FMCG',
    ];

    for (const name of customerTypes) {
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM customer_type WHERE name = ?',
        { replacements: [name] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert(
          'customer_type',
          [
            {
              name,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          {}
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('customer_type', null, {});
  },
};
