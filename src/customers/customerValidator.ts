import Joi, { custom } from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(15).required(),
  email: Joi.string().email().max(255).optional().allow(null, ''),
  address: Joi.string().allow(null, '').optional(),
  ship_address: Joi.string().allow(null, '').optional(),
  gst_number: Joi.string().allow(null, '').optional(),
  pan_number: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('Individual', 'Company').required(),
  customer_type_id: Joi.number().integer().positive().required(),
  status: Joi.boolean().optional()
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(15).required(),
  email:Joi.string().email().max(255).optional().allow(null, ''),
  address: Joi.string().allow(null, '').optional(),
  ship_address: Joi.string().allow(null, '').optional(),
  gst_number: Joi.string().allow(null, '').optional(),
  pan_number: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('Individual', 'Company').required(),
  customer_type_id: Joi.number().integer().positive().required(),
  status: Joi.boolean().optional()
}).min(1);

export const listCustomersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  name: Joi.string().max(255).optional()
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
export const bulkCreateCustomersSchema = Joi.object({
  customers: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().max(255).required(),
        mobile: Joi.string().max(15).required(),
        email: Joi.string().email().max(255).optional().allow(null, ''),
        address: Joi.string().allow(null, '').optional(),
        ship_address: Joi.string().allow(null, '').optional(),
        gst_number: Joi.string().allow(null, '').optional(),
        pan_number: Joi.string().allow(null, '').optional(),
        type: Joi.string().valid('Individual', 'Company').optional(),
        customer_type_id: Joi.number().integer().positive().optional(),
        customer_type: Joi.string().max(255).optional(),
        status: Joi.boolean().optional(),
        created_by: Joi.number().integer().optional().allow(null),
      })
    )
    .min(1)
    .required(),
});

export const createCustomerDetailSchema = Joi.object({
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(15).required(),
  email: Joi.string().email().max(255).allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  ship_address: Joi.string().allow(null, '').optional(),
  gst_number: Joi.string().allow(null, '').optional(),
  pan_number: Joi.string().allow(null, '').optional(),
  is_primary: Joi.boolean().optional(),
});

export const updateCustomerDetailSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  mobile: Joi.string().max(15).required(),
  email: Joi.string().email().max(255).allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  ship_address: Joi.string().allow(null, '').optional(),
  gst_number: Joi.string().allow(null, '').optional(),
  pan_number: Joi.string().allow(null, '').optional(),
  is_primary: Joi.boolean().optional(),
}).min(1);

export const customerDetailParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  detailId: Joi.number().integer().positive().required(),
});
