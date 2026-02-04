import { initializeDatabase } from '../config/initdb';
import { Role } from '../models';

const roles = ['Super Admin', 'Admin', 'Staff', 'Technician'];
const companyID = 1;

async function seedRoles() {
  try {
    // Ensure DB connection and models are synchronized
    await initializeDatabase();

    for (const type of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { type },
        defaults: { is_active: true, company_id: companyID },
      });
      console.log(`${created ? 'Created' : 'Exists'} role: ${type}`);
    }

    console.log('Role seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
}

seedRoles();
