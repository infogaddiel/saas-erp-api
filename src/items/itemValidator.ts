import Joi from 'joi';

export const createItemSchema = Joi.object({
  item_code: Joi.string().max(100).required(),
  item_name: Joi.string().max(255).required(),
  description: Joi.string().allow(null, '').optional(),
  type: Joi.string().max(100).required(),
  category: Joi.string().max(100).required(),
  unit_price: Joi.number().positive().required(),
  gst_percentage: Joi.number().min(0).max(100).optional().default(18.0),
  unit: Joi.string().max(50).required(),
  stock_quantity: Joi.number().integer().min(0).optional().default(0),
  notes: Joi.string().allow(null, '').optional(),
  status: Joi.boolean().optional().default(true),
  created_by: Joi.number().integer().optional().allow(null),
});

export const updateItemSchema = Joi.object({
  item_code: Joi.string().max(100).optional(),
  item_name: Joi.string().max(255).optional(),
  description: Joi.string().allow(null, '').optional(),
  type: Joi.string().max(100).optional(),
  category: Joi.string().max(100).optional(),
  unit_price: Joi.number().positive().optional(),
  gst_percentage: Joi.number().min(0).max(100).optional(),
  unit: Joi.string().max(50).optional(),
  stock_quantity: Joi.number().integer().min(0).optional(),
  notes: Joi.string().allow(null, '').optional(),
  status: Joi.boolean().optional(),
}).min(1);

export const listItemsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  name: Joi.string().max(255).optional(),
  code: Joi.string().max(100).optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
export const bulkCreateItemsSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        item_code: Joi.string().max(100).required(),
        item_name: Joi.string().max(255).required(),
        description: Joi.string().allow(null, '').optional(),
        type: Joi.string().max(100).required(),
        category: Joi.string().max(100).required(),
        unit_price: Joi.number().positive().required(),
        gst_percentage: Joi.number().min(0).max(100).optional().default(18.0),
        unit: Joi.string().max(50).required(),
        stock_quantity: Joi.number().integer().min(0).optional().default(0),
        notes: Joi.string().allow(null, '').optional(),
      })
    )
    .min(1)
    .required(),
});