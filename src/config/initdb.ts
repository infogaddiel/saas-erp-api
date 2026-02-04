import sequelize from './database';
import { User, Company, Role } from '../models';

export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection established');

    // Sync models with database
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
