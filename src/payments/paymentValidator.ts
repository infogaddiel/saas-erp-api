import Joi from 'joi';

const dateOnlySchema = Joi.string()
  .pattern(/^\d{4}-\d{2}-\d{2}$/)
  .required()
  .custom((value, helpers) => {
    const [y, m, d] = String(value).split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return helpers.error('date.invalid');
    }
    return value;
  }, 'yyyy-mm-dd date-only validation')
  .messages({ 'date.invalid': 'date must be a valid date in yyyy-mm-dd format' });

const optionalDateOnlySchema = Joi.string()
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

export const createPaymentSchema = Joi.object({
  pay_to: Joi.string().trim().min(1).max(255).required(),
  payment_date: dateOnlySchema,
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().trim().min(1).max(50).required(),
  category: Joi.string().trim().min(1).max(100).required(),
  transaction_reference: Joi.string().trim().max(255).optional().allow(null, ''),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
  invoice_id: Joi.number().integer().positive().optional().allow(null),
});

export const updatePaymentSchema = Joi.object({
  pay_to: Joi.string().trim().min(1).max(255).optional(),
  payment_date: optionalDateOnlySchema,
  amount: Joi.number().min(0).optional(),
  payment_method: Joi.string().trim().min(1).max(50).optional(),
  category: Joi.string().trim().min(1).max(100).optional(),
  transaction_reference: Joi.string().trim().max(255).optional().allow(null, ''),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
  invoice_id: Joi.number().integer().positive().optional().allow(null),
}).min(1);

export const listPaymentsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  payment_date_from: optionalDateOnlySchema,
  payment_date_to: optionalDateOnlySchema,
}).custom((value, helpers) => {
  if (value.payment_date_from && value.payment_date_to && new Date(value.payment_date_to) < new Date(value.payment_date_from)) {
    return helpers.message({ custom: 'payment_date_to must be greater than or equal to payment_date_from' });
  }
  return value;
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
