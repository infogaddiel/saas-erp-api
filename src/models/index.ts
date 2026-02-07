import User from './User';
import Company from './Company';
import Role from './Role';
import Customer from './Customer';
import Menu from './Menu';
import Item from './Item';

// Define associations
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

// User - Role (single role)
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// User - Customer (created_by)
Customer.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Customer, { foreignKey: 'created_by', as: 'customers' });

// User - Menu many-to-many
User.belongsToMany(Menu, { through: 'user_menus', as: 'menus', foreignKey: 'user_id', otherKey: 'menu_id' });

// User - Item (created_by)
Item.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Item, { foreignKey: 'created_by', as: 'items' });
Menu.belongsToMany(User, { through: 'user_menus', as: 'users', foreignKey: 'menu_id', otherKey: 'user_id' });

export { User, Company, Role, Customer, Menu, Item };  
