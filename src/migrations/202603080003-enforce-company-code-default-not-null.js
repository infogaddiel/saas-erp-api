'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE company
      SET company_code = 'GED'
      WHERE company_code IS NULL OR BTRIM(company_code) = '';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE company
      ALTER COLUMN company_code SET DEFAULT 'GED';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE company
      ALTER COLUMN company_code SET NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE company
      DROP CONSTRAINT IF EXISTS company_company_code_len_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE company
      ADD CONSTRAINT company_company_code_len_check
      CHECK (CHAR_LENGTH(BTRIM(company_code)) = 3);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE company
      DROP CONSTRAINT IF EXISTS company_company_code_len_check;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE company
      ALTER COLUMN company_code DROP NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE company
      ALTER COLUMN company_code DROP DEFAULT;
    `);
  },
};
