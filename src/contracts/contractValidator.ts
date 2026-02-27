import Joi from 'joi';

const CONTRACT_TYPES = ['AMC', 'Service', 'Subscription'] as const;
const CONTRACT_STATUSES = ['Draft', 'Active', 'Expired', 'Terminated'] as const;
const BILLING_FREQUENCIES = ['One-time', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] as const;
const SERVICE_STATUSES = ['Scheduled', 'In-Progress', 'Completed', 'Cancelled'] as const;
const INVOICE_STATUSES = ['Pending', 'Invoiced', 'Paid'] as const;

const serviceScheduleSchema = Joi.object({
  planned_date: Joi.date().iso().raw().required(),
  actual_date: Joi.date().iso().raw().optional().allow(null),
  service_status: Joi.string()
    .valid(...SERVICE_STATUSES)
    .optional()
    .default('Scheduled'),
  technician_id: Joi.number().integer().positive().optional().allow(null),
  service_notes: Joi.string().max(10000).optional().allow(null, ''),
});

const contractItemSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
  asset_id: Joi.number().integer().positive().optional().allow(null),
  quantity: Joi.number().integer().min(1).optional().default(1),
  unit_price: Joi.number().min(0).required(),
  billing_frequency: Joi.string()
    .valid(...BILLING_FREQUENCIES)
    .required(),
  is_renewable: Joi.boolean().optional().default(true),
  service_schedules: Joi.array().items(serviceScheduleSchema).optional().default([]),
});

const contractInvoiceSchema = Joi.object({
  scheduled_billing_date: Joi.date().iso().raw().required(),
  amount_to_bill: Joi.number().min(0).required(),
  invoice_reference: Joi.string().max(50).optional().allow(null, ''),
  billing_status: Joi.string()
    .valid(...INVOICE_STATUSES)
    .optional()
    .default('Pending'),
});

export const createContractSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(10000).optional().allow(null, ''),
  customer_id: Joi.number().integer().positive().required(),
  project_id: Joi.number().integer().positive().required(),
  contract_number: Joi.string().trim().max(50).optional(),
  contract_type: Joi.string()
    .valid(...CONTRACT_TYPES)
    .required(),
  status: Joi.string()
    .valid(...CONTRACT_STATUSES)
    .optional()
    .default('Draft'),
  start_date: Joi.date().iso().raw().required(),
  end_date: Joi.date().iso().raw().required(),
  total_value: Joi.number().min(0).optional(),
  currency: Joi.string().uppercase().length(3).optional().default('USD'),
  line_items: Joi.array().items(contractItemSchema).optional().default([]),
  invoices: Joi.array().items(contractInvoiceSchema).optional().default([]),
}).custom((value, helpers) => {
  const startDate = new Date(value.start_date);
  const endDate = new Date(value.end_date);
  if (startDate > endDate) {
    return helpers.message({ custom: 'end_date must be greater than or equal to start_date' });
  }
  return value;
});

export const updateContractSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().max(10000).optional().allow(null, ''),
  customer_id: Joi.number().integer().positive().optional(),
  project_id: Joi.number().integer().positive().optional(),
  contract_number: Joi.string().trim().max(50).optional(),
  contract_type: Joi.string()
    .valid(...CONTRACT_TYPES)
    .optional(),
  status: Joi.string()
    .valid(...CONTRACT_STATUSES)
    .optional(),
  start_date: Joi.date().iso().raw().optional(),
  end_date: Joi.date().iso().raw().optional(),
  total_value: Joi.number().min(0).optional(),
  currency: Joi.string().uppercase().length(3).optional(),
  line_items: Joi.array().items(contractItemSchema).optional(),
  invoices: Joi.array().items(contractInvoiceSchema).optional(),
})
  .min(1)
  .custom((value, helpers) => {
    if (value.start_date && value.end_date) {
      const startDate = new Date(value.start_date);
      const endDate = new Date(value.end_date);
      if (startDate > endDate) {
        return helpers.message({ custom: 'end_date must be greater than or equal to start_date' });
      }
    }
    return value;
  });

export const listContractsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  customer_id: Joi.number().integer().positive().optional(),
  project_id: Joi.number().integer().positive().optional(),
  contract_number: Joi.string().trim().max(50).optional().allow(''),
  contract_type: Joi.string()
    .valid(...CONTRACT_TYPES)
    .optional(),
  status: Joi.string()
    .valid(...CONTRACT_STATUSES)
    .optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
