import sequelize from './database';
import { User, Company, Role, TicketStatus, LeadStatus } from '../models';

const DEFAULT_TICKET_STATUSES = ['Open', 'In Progress', 'Closed', 'Re-Open', 'Cancelled'];
const DEFAULT_LEAD_STATUSES = ['Contact in future', 'New', 'In Progress', 'Won', 'Lost'];

export const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');

    // Test the connection
    await sequelize.authenticate();
    console.log('Database connection established');

    // Sync models with database
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized');

    for (const name of DEFAULT_TICKET_STATUSES) {
      await TicketStatus.findOrCreate({ where: { name } });
    }
    console.log('Ticket statuses synchronized');

    for (const name of DEFAULT_LEAD_STATUSES) {
      await LeadStatus.findOrCreate({ where: { name } });
    }
    console.log('Lead statuses synchronized');

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
