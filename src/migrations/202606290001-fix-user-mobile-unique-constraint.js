'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Drop the existing unique constraint on mobile alone
    await queryInterface.sequelize.query(
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_key;`
    );

    // 2. Drop any other unique index on mobile alone (if named differently)
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS users_mobile_key;`
    );

    // 3. Add partial composite unique index: same mobile+company_id only blocked
    //    when deleted_at IS NULL (active users). Deleted users can be re-added.
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_company_unique
       ON users (mobile, company_id)
       WHERE deleted_at IS NULL;`
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert: drop composite index, restore single mobile unique constraint
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS users_mobile_company_unique;`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE users ADD CONSTRAINT users_mobile_key UNIQUE (mobile);`
    );
  },
};
