import { initializeDatabase } from '../config/initdb';
import { User, Role, Company } from '../models';
import { hashPassword } from '../services/authService';

async function seedUsers() {
  try {
    // Ensure DB connection and models are synchronized
    await initializeDatabase();

    // Find the Super Admin role
    const superAdminRole = await Role.findOne({ where: { type: 'Super Admin' } });
    if (!superAdminRole) {
      console.error('Super Admin role not found. Please run seedRoles.ts first.');
      process.exit(1);
    }

    // Find the company (assuming 'gaddiel')
    const company = await Company.findOne({ where: { name: 'gaddiel' } });
    if (!company) {
      console.error('Company not found. Please run seedCompanies.ts first.');
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await hashPassword('12345678');

    // Create the Super Admin user
    const [user, created] = await User.findOrCreate({
      where: { mobile: '7859647855' },
      defaults: {
        name: 'Super Admin',
        email: "admin@gaddiel.com",
        profile_image: null,
        mobile: '7859647855',
        password: hashedPassword,
        company_id: 1,
        role_id: 1,
        blocked: false,
        mobile_otp: null,
      },
    });

    console.log(`${created ? 'Created' : 'Exists'} user: ${user.name}`);

    console.log('User seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();