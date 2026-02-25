import Joi from 'joi';

// dd-mm-yyyy string to valid date (for storage we use DATEONLY YYYY-MM-DD)
const scheduledDateSchema = Joi.string()
  .pattern(/^\d{2}-\d{2}-\d{4}$/)
  .optional()
  .allow(null, '')
  .custom((value, helpers) => {
    if (value == null || value === '') return value;
    const [d, m, y] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return helpers.error('date.invalid');
    }
    return value;
  }, 'dd-mm-yyyy date validation')
  .messages({ 'date.invalid': 'scheduled_date must be a valid date in dd-mm-yyyy format' });

export const createTicketSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    'any.required': 'customer_id is required',
  }),
  status_id: Joi.number().integer().positive().optional(),
  service_address: Joi.string().min(1).max(2000).required().messages({
    'string.empty': 'Service address is required',
  }),
  priority: Joi.string()
    .optional()
    .default('Medium'),
  service_type: Joi.string()
    .required()
    .messages({ 'any.required': 'service_type is required' }),
  assigned_technician_id: Joi.number().integer().positive().optional().allow(null),
  scheduled_date: scheduledDateSchema,
  equipment_type: Joi.string().max(255).optional().allow(null, ''),
  equipment_model: Joi.string().max(255).optional().allow(null, ''),
  issue_description: Joi.string().min(1).max(5000).required().messages({
    'string.empty': 'Issue description is required',
  }),
});

export const updateTicketSchema = Joi.object({
  customer_id: Joi.number().integer().positive().optional(),
  status_id: Joi.number().integer().positive().optional(),
  service_address: Joi.string().min(1).max(2000).optional(),
  priority: Joi.string()
    .optional(),
  service_type: Joi.string()
    .optional(),
  assigned_technician_id: Joi.number().integer().positive().optional().allow(null),
  scheduled_date: scheduledDateSchema,
  equipment_type: Joi.string().max(255).optional().allow(null, ''),
  equipment_model: Joi.string().max(255).optional().allow(null, ''),
  issue_description: Joi.string().min(1).max(5000).optional(),
}).min(1);

export const listTicketsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  status_id: Joi.number().integer().positive().optional(),
  priority: Joi.string()
    .optional(),
  service_type: Joi.string()
    .optional(),
  assigned_technician_id: Joi.number().integer().positive().optional(),
  customer_id: Joi.number().integer().positive().optional(),
});

export const listTicketServicesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

export const ticketDropdownSchema = Joi.object({
  ticket_number: Joi.string().max(50).optional().allow(''),
  customer_id: Joi.number().integer().positive().optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const ticketServiceParamSchema = Joi.object({
  ticketId: Joi.number().integer().positive().required(),
});

export const ticketServiceIdParamSchema = Joi.object({
  ticketId: Joi.number().integer().positive().required(),
  serviceId: Joi.number().integer().positive().required(),
});

export const createTicketServiceSchema = Joi.object({
  contract_id: Joi.number().integer().positive().required(),
  customer_id: Joi.number().integer().positive().optional().allow(null),
  customer_name: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'customer_name is required',
  }),
  email: Joi.string().email().max(255).optional().allow(null, ''),
  phone: Joi.string().max(30).optional().allow(null, ''),
  service_date: Joi.date().iso().raw().required(),
  service_address: Joi.string().min(1).max(2000).required().messages({
    'string.empty': 'service_address is required',
  }),
  service_type: Joi.string().max(100).optional().default('Repair'),
  user_id: Joi.number().integer().positive().optional().allow(null),
  equipment_type: Joi.string().max(255).optional().allow(null, ''),
  equipment_model: Joi.string().max(255).optional().allow(null, ''),
  work_performed: Joi.string().max(5000).optional().allow(null, ''),
  parts_used: Joi.string().max(5000).optional().allow(null, ''),
  labor_hours: Joi.number().min(0).optional().default(0),
  photos: Joi.array().items(Joi.string()).optional().default([]),
  video: Joi.string().optional().allow(null, ''),
  customer_signature: Joi.string().optional().allow(null, ''),
  report_status: Joi.string().max(50).optional().default('Draft'),
});

export const updateTicketServiceSchema = Joi.object({
  contract_id: Joi.number().integer().positive().optional(),
  customer_id: Joi.number().integer().positive().optional().allow(null),
  customer_name: Joi.string().min(1).max(255).optional(),
  email: Joi.string().email().max(255).optional().allow(null, ''),
  phone: Joi.string().max(30).optional().allow(null, ''),
  service_date: Joi.date().iso().raw().required(),
  service_address: Joi.string().min(1).max(2000).optional(),
  service_type: Joi.string().max(100).optional(),
  user_id: Joi.number().integer().positive().optional().allow(null),
  equipment_type: Joi.string().max(255).optional().allow(null, ''),
  equipment_model: Joi.string().max(255).optional().allow(null, ''),
  work_performed: Joi.string().max(5000).optional().allow(null, ''),
  parts_used: Joi.string().max(5000).optional().allow(null, ''),
  labor_hours: Joi.number().min(0).optional(),
  photos: Joi.array().items(Joi.string()).optional().allow(null),
  video: Joi.string().optional().allow(null, ''),
  customer_signature: Joi.string().optional().allow(null, ''),
  report_status: Joi.string().max(50).optional(),
}).min(1);
