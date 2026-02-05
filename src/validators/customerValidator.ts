import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(20).allow(null, '').optional(),
  email: Joi.string().email().max(255).allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('Individual', 'Company').required(),
  status: Joi.boolean().optional(),
  created_by: Joi.number().integer().positive().optional().allow(null),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  mobile: Joi.string().max(20).allow(null, '').optional(),
  email: Joi.string().email().max(255).allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('Individual', 'Company').optional(),
  status: Joi.boolean().optional(),
  created_by: Joi.number().integer().positive().optional().allow(null),
}).min(1);

export const listCustomersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
