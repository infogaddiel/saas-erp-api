'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const menus = [
      { name: 'Dashboard', description: 'Main dashboard' },
      { name: 'Users', description: 'User management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Settings', description: 'Application settings' },
    ];

    for (const menu of menus) {
      const [results] = await queryInterface.sequelize.query(
        'SELECT id FROM menus WHERE name = ?',
        { replacements: [menu.name] }
      );

      if (results.length === 0) {
        await queryInterface.bulkInsert('menus', [{
          name: menu.name,
          description: menu.description,
          status: true,
          created_at: new Date(),
          updated_at: new Date(),
        }], {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('menus', null, {});
  }
};