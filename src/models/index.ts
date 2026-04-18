import User from './User';
import Company from './Company';
import Role from './Role';
import Customer from './Customer';
import CustomerType from './CustomerType';
import CustomerDetail from './CustomerDetail';
import Menu from './Menu';
import Item from './Item';
import Permission from './Permission';
import Ticket from './Ticket';
import TicketStatus from './TicketStatus';
import TicketStatusHistory from './TicketStatusHistory';
import TicketService from './TicketService';
import Contract from './Contract';
import ContractItem from './ContractItem';
import ServiceSchedule from './ServiceSchedule';
import ContractInvoice from './ContractInvoice';
import Project from './Project';
import ProjectFile from './ProjectFile';
import Lead from './Lead';
import LeadStatus from './LeadStatus';
import LeadStatusChangeHistory from './LeadStatusChangeHistory';
import Vendor from './Vendor';
import PurchaseOrder from './PurchaseOrder';
import Invoice from './Invoice';
import InvoiceLineItem from './InvoiceLineItem';
import Receipt from './Receipt';
import Payment from './Payment';
import CreditNote from './CreditNote';
import Question from './Question';
import UserFeedback from './UserFeedback';

// Define associations
User.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(User, { foreignKey: 'company_id', as: 'users' });

// User - Role (single role)
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// User - Customer (created_by)
Customer.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Customer, { foreignKey: 'created_by', as: 'customers' });

// Customer - CustomerType
Customer.belongsTo(CustomerType, { foreignKey: 'customer_type_id', as: 'customerType' });
CustomerType.hasMany(Customer, { foreignKey: 'customer_type_id', as: 'customers' });

// Customer - CustomerDetail
CustomerDetail.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(CustomerDetail, { foreignKey: 'customer_id', as: 'customerDetails' });

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

TicketService.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(TicketService, { foreignKey: 'customer_id', as: 'ticketServices' });
TicketService.belongsTo(User, { foreignKey: 'user_id', as: 'technician' });
User.hasMany(TicketService, { foreignKey: 'user_id', as: 'ticketServices' });
TicketService.belongsTo(Contract, { foreignKey: 'contract_id', as: 'contract' });
Contract.hasMany(TicketService, { foreignKey: 'contract_id', as: 'ticketServices' });

// Contract - Customer
Contract.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Contract, { foreignKey: 'customer_id', as: 'contracts' });

// Contract - Project
Contract.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(Contract, { foreignKey: 'project_id', as: 'contracts' });

// ContractItem - Contract
ContractItem.belongsTo(Contract, { foreignKey: 'contract_id', as: 'contract' });
Contract.hasMany(ContractItem, { foreignKey: 'contract_id', as: 'lineItems' });

// ContractItem - Item (product)
ContractItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
Item.hasMany(ContractItem, { foreignKey: 'item_id', as: 'contractItems' });

// ServiceSchedule - ContractItem
ServiceSchedule.belongsTo(ContractItem, { foreignKey: 'contract_item_id', as: 'lineItem' });
ContractItem.hasMany(ServiceSchedule, { foreignKey: 'contract_item_id', as: 'serviceSchedules' });

// ServiceSchedule - User (technician)
ServiceSchedule.belongsTo(User, { foreignKey: 'technician_id', as: 'technician' });
User.hasMany(ServiceSchedule, { foreignKey: 'technician_id', as: 'serviceSchedules' });

// ContractInvoice - Contract
ContractInvoice.belongsTo(Contract, { foreignKey: 'contract_id', as: 'contract' });
Contract.hasMany(ContractInvoice, { foreignKey: 'contract_id', as: 'invoices' });

// Project - User (created_by)
Project.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Project, { foreignKey: 'created_by', as: 'projects' });

// Project - Customer
Project.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Project, { foreignKey: 'customer_id', as: 'projects' });

// Project - ProjectFile
ProjectFile.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(ProjectFile, { foreignKey: 'project_id', as: 'documents' });

// Lead - LeadStatus
Lead.belongsTo(LeadStatus, { foreignKey: 'lead_status_id', as: 'leadStatus' });
LeadStatus.hasMany(Lead, { foreignKey: 'lead_status_id', as: 'leads' });

// Lead - User (created_by)
Lead.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Lead, { foreignKey: 'created_by', as: 'leads' });

// LeadStatusChangeHistory - Lead
LeadStatusChangeHistory.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Lead.hasMany(LeadStatusChangeHistory, { foreignKey: 'lead_id', as: 'statusHistory' });

// LeadStatusChangeHistory - LeadStatus
LeadStatusChangeHistory.belongsTo(LeadStatus, { foreignKey: 'status_id', as: 'status' });
LeadStatus.hasMany(LeadStatusChangeHistory, { foreignKey: 'status_id', as: 'history' });

// LeadStatusChangeHistory - User (changed_by)
LeadStatusChangeHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changedBy' });
User.hasMany(LeadStatusChangeHistory, { foreignKey: 'changed_by', as: 'leadStatusChanges' });

// Vendor - User (created_by)
Vendor.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Vendor, { foreignKey: 'created_by', as: 'vendors' });

// PurchaseOrder - Vendor
PurchaseOrder.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Vendor.hasMany(PurchaseOrder, { foreignKey: 'vendor_id', as: 'purchaseOrders' });

// PurchaseOrder - User (created_by)
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'purchaseOrders' });

// Invoice - User (created_by)
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
User.hasMany(Invoice, { foreignKey: 'created_by', as: 'invoices' });

// InvoiceLineItem - Invoice
InvoiceLineItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Invoice.hasMany(InvoiceLineItem, { foreignKey: 'invoice_id', as: 'lineItems' });

// InvoiceLineItem - Item
InvoiceLineItem.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });
Item.hasMany(InvoiceLineItem, { foreignKey: 'item_id', as: 'invoiceLineItems' });

// Receipt - Invoice (optional)
Receipt.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Invoice.hasMany(Receipt, { foreignKey: 'invoice_id', as: 'receipts' });

// Payment - Invoice (optional)
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Invoice.hasMany(Payment, { foreignKey: 'invoice_id', as: 'payments' });

// CreditNote - Invoice (optional)
CreditNote.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
Invoice.hasMany(CreditNote, { foreignKey: 'invoice_id', as: 'creditNotes' });

// UserFeedback - User
UserFeedback.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserFeedback, { foreignKey: 'user_id', as: 'userFeedbacks' });

// UserFeedback - Question
UserFeedback.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
Question.hasMany(UserFeedback, { foreignKey: 'question_id', as: 'userFeedbacks' });

export {
  User,
  Company,
  Role,
  Customer,
  CustomerType,
  CustomerDetail,
  Menu,
  Item,
  Permission,
  Ticket,
  TicketStatus,
  TicketStatusHistory,
  TicketService,
  Contract,
  ContractItem,
  ServiceSchedule,
  ContractInvoice,
  Project,
  ProjectFile,
  Lead,
  LeadStatus,
  LeadStatusChangeHistory,
  Vendor,
  PurchaseOrder,
  Invoice,
  InvoiceLineItem,
  Receipt,
  Payment,
  CreditNote,
  Question,
  UserFeedback,
};
