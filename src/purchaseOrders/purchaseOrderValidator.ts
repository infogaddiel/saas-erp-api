import Joi from 'joi';
import { PURCHASE_ORDER_STATUSES } from '../models/PurchaseOrder';

const dateSchema = Joi.string()
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
  .messages({ 'date.invalid': 'date must be a valid date in dd-mm-yyyy format' });

export const createPurchaseOrderSchema = Joi.object({
  po_number: Joi.string().trim().max(50).optional().allow(null, ''),
  vendor_id: Joi.number().integer().positive().required(),
  order_date: dateSchema.required(),
  expected_delivery: dateSchema,
  total_amount: Joi.number().min(0).required(),
  status: Joi.string()
    .valid(...PURCHASE_ORDER_STATUSES)
    .optional()
    .default('Draft'),
  items_description: Joi.string().trim().max(10000).optional().allow(null, ''),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
  created_by: Joi.number().integer().optional().allow(null),
}).custom((value, helpers) => {
  if (!value.order_date || !value.expected_delivery) return value;
  const [od, om, oy] = value.order_date.split('-').map(Number);
  const [ed, em, ey] = value.expected_delivery.split('-').map(Number);
  const orderDate = new Date(oy, om - 1, od);
  const expectedDate = new Date(ey, em - 1, ed);
  if (expectedDate < orderDate) {
    return helpers.message({ custom: 'expected_delivery must be greater than or equal to order_date' });
  }
  return value;
});

export const updatePurchaseOrderSchema = Joi.object({
  po_number: Joi.string().trim().max(50).optional().allow(null, ''),
  vendor_id: Joi.number().integer().positive().optional(),
  order_date: dateSchema,
  expected_delivery: dateSchema,
  total_amount: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid(...PURCHASE_ORDER_STATUSES)
    .optional(),
  items_description: Joi.string().trim().max(10000).optional().allow(null, ''),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
})
  .min(1)
  .custom((value, helpers) => {
    if (!value.order_date || !value.expected_delivery) return value;
    const [od, om, oy] = value.order_date.split('-').map(Number);
    const [ed, em, ey] = value.expected_delivery.split('-').map(Number);
    const orderDate = new Date(oy, om - 1, od);
    const expectedDate = new Date(ey, em - 1, ed);
    if (expectedDate < orderDate) {
      return helpers.message({ custom: 'expected_delivery must be greater than or equal to order_date' });
    }
    return value;
  });

export const listPurchaseOrdersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  vendor_id: Joi.number().integer().positive().optional(),
  status: Joi.string()
    .valid(...PURCHASE_ORDER_STATUSES)
    .optional(),
  po_number: Joi.string().trim().max(50).optional().allow(''),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
