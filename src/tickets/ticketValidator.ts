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
  priority: Joi.string()
    .optional(),
  service_type: Joi.string()
    .optional(),
  assigned_technician_id: Joi.number().integer().positive().optional(),
  customer_id: Joi.number().integer().positive().optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
