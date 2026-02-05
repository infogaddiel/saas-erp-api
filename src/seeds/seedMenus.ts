import { initializeDatabase } from '../config/initdb';
import { Menu } from '../models';

const menus = [
  'Sales',
  'Purchase',
  'Finance',
  'Staff & Technician',
  'Project',
  'Tickets & Services',
  'Reports',
  'Calander',
  'settings',
];

async function seedMenus() {
  try {
    await initializeDatabase();

    for (const name of menus) {
      const [menu, created] = await Menu.findOrCreate({
        where: { name },
        defaults: { description: null, status: true },
      });
      console.log(`${created ? 'Created' : 'Exists'} menu: ${name}`);
    }

    console.log('Menu seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding menus:', error);
    process.exit(1);
  }
}

seedMenus();
