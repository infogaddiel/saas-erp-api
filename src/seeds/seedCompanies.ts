import { initializeDatabase } from '../config/initdb';
import { Company } from '../models';

const companies = ['gaddiel', 'testing'];

async function seedCompanies() {
  try {
    await initializeDatabase();

    for (const name of companies) {
      const [company, created] = await Company.findOrCreate({
        where: { name },
        defaults: { address: null, contract: null },
      });
      console.log(`${created ? 'Created' : 'Exists'} company: ${name}`);
    }

    console.log('Company seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding companies:', error);
    process.exit(1);
  }
}

seedCompanies();
