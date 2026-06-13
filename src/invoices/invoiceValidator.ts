import Joi from 'joi';

const dateOnlySchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .allow(null, '')
  .custom((value, helpers) => {
    if (value == null || value === '') return value;
    const [y, m, d] = String(value).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return helpers.error('date.invalid');
    }
    return value;
  }, 'yyyy-mm-dd date-only validation')
  .messages({ 'date.invalid': 'date must be a valid date in yyyy-mm-dd format' });

const lineItemSchema = Joi.object({
  item_id: Joi.number().integer().positive().required(),
  unit: Joi.number().min(0).optional().default(0),
  price: Joi.number().min(0).optional().default(0),
  quantity: Joi.number().min(0).optional().default(0),
  discount: Joi.number().min(0).optional().default(0),
  discount_amount: Joi.number().min(0).optional().default(0),
  tax: Joi.number().min(0).optional().default(0),
  tax_amount: Joi.number().min(0).optional().default(0),
  final_price: Joi.number().min(0).optional().default(0),
});

export const createInvoiceSchema = Joi.object({
  customer_name: Joi.string().trim().min(1).max(255).required(),
  payment_status: Joi.string().trim().max(50).optional().allow(null, ''),
  invoice_date: dateOnlySchema,
  due_date: dateOnlySchema,
  sub_total: Joi.number().min(0).optional(),
  tax_amount: Joi.number().min(0).optional(),
  total_amount: Joi.number().min(0).optional(),
  amount_paid: Joi.number().min(0).optional(),
  line_items: Joi.array().items(lineItemSchema).optional().default([]),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
  created_by: Joi.number().integer().optional().allow(null),
}).custom((value, helpers) => {
  if (!value.invoice_date || !value.due_date) return value;
  const invoiceDate = new Date(value.invoice_date);
  const dueDate = new Date(value.due_date);
  if (dueDate < invoiceDate) {
    return helpers.message({ custom: 'due_date must be greater than or equal to invoice_date' });
  }
  return value;
});

export const updateInvoiceSchema = Joi.object({
  customer_name: Joi.string().trim().min(1).max(255).optional(),
  payment_status: Joi.string().trim().max(50).optional().allow(null, ''),
  invoice_date: dateOnlySchema,
  due_date: dateOnlySchema,
  sub_total: Joi.number().min(0).optional(),
  tax_amount: Joi.number().min(0).optional(),
  total_amount: Joi.number().min(0).optional(),
  amount_paid: Joi.number().min(0).optional(),
  line_items: Joi.array().items(lineItemSchema).optional(),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
})
  .min(1)
  .custom((value, helpers) => {
    if (!value.invoice_date || !value.due_date) return value;
    const invoiceDate = new Date(value.invoice_date);
    const dueDate = new Date(value.due_date);
    if (dueDate < invoiceDate) {
      return helpers.message({ custom: 'due_date must be greater than or equal to invoice_date' });
    }
    return value;
  });

export const listInvoicesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  payment_status: Joi.string().trim().max(50).optional().allow(''),
  customer_name: Joi.string().trim().max(255).optional().allow(''),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const dropdownInvoiceSchema = Joi.object({
  searchText: Joi.string().max(255).optional().allow(''),
});
