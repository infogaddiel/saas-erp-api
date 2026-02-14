import User from './User';
import Company from './Company';
import Role from './Role';
import Customer from './Customer';
import Menu from './Menu';
import Item from './Item';
import Permission from './Permission';
import Ticket from './Ticket';
import TicketStatus from './TicketStatus';
import TicketStatusHistory from './TicketStatusHistory';
import TicketService from './TicketService';

// Define associations
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

// User - Role (single role)
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// User - Customer (created_by)
Customer.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Customer, { foreignKey: 'created_by', as: 'customers' });

// User - Menu many-to-many through Permission
User.hasMany(Permission, { foreignKey: 'user_id', as: 'permissions' });
Permission.belongsTo(User, { foreignKey: 'user_id' });

Permission.belongsTo(Menu, { foreignKey: 'menu_id', as: 'menu' });
Menu.hasMany(Permission, { foreignKey: 'menu_id', as: 'permissions' });

// User - Item (created_by)
Item.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Item, { foreignKey: 'created_by', as: 'items' });

// Ticket - Customer (belongs to)
Ticket.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Ticket, { foreignKey: 'customer_id', as: 'tickets' });

// Ticket - TicketStatus
Ticket.belongsTo(TicketStatus, { foreignKey: 'status_id', as: 'status' });
TicketStatus.hasMany(Ticket, { foreignKey: 'status_id', as: 'tickets' });

// Ticket - User (assigned technician, optional)
Ticket.belongsTo(User, { foreignKey: 'assigned_technician_id', as: 'assignedTechnician' });
User.hasMany(Ticket, { foreignKey: 'assigned_technician_id', as: 'assignedTickets' });

// Ticket - User (created_by)
Ticket.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Ticket, { foreignKey: 'created_by', as: 'tickets' });

// TicketStatusHistory - Ticket
TicketStatusHistory.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
Ticket.hasMany(TicketStatusHistory, { foreignKey: 'ticket_id', as: 'statusHistory' });

// TicketStatusHistory - TicketStatus
TicketStatusHistory.belongsTo(TicketStatus, { foreignKey: 'status_id', as: 'status' });
TicketStatus.hasMany(TicketStatusHistory, { foreignKey: 'status_id', as: 'history' });

// TicketStatusHistory - User (changed_by)
TicketStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });
User.hasMany(TicketStatusHistory, { foreignKey: 'changed_by', as: 'ticketStatusChanges' });

// TicketService - Ticket
TicketService.belongsTo(Ticket, { foreignKey: 'ticket_id', as: 'ticket' });
Ticket.hasMany(TicketService, { foreignKey: 'ticket_id', as: 'services' });

export { User, Company, Role, Customer, Menu, Item, Permission, Ticket, TicketStatus, TicketStatusHistory, TicketService };
