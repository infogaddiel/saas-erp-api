'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const users = [
      {
        name: 'Super Admin',
        mobile: '1234567890',
        email: 'superadmin@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        company_id: 1,
        role_id: 1,
        blocked: false,
      },
      {
        name: 'Admin',
        mobile: '1234567891',
        email: 'admin@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        company_id: 1,
        role_id: 2,
        blocked: false,
      },
      {
        name: 'Staff',
        mobile: '1234567892',
        email: 'staff@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        company_id: 1,
        role_id: 3,
        blocked: false,
      },
    ];

    for (const user of users) {
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM users WHERE email = ?',
        { replacements: [user.email] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert('users', [{
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          password: user.password,
          company_id: user.company_id,
          role_id: user.role_id,
          blocked: user.blocked,
          profile_image: null,
          mobile_otp: null,
          created_at: new Date(),
          updated_at: new Date(),
        }], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};