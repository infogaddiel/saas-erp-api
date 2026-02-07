import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(15).required(),
  email: Joi.string().email().max(255).required(),
  address: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('Individual', 'Company').required(),
  status: Joi.boolean().optional()
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().max(255).required(),
  address: Joi.string().allow(null, '').optional(),
  type: Joi.string().valid('Individual', 'Company').required(),
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
        email: Joi.string().email().max(255).required(),
        address: Joi.string().allow(null, '').optional(),
        type: Joi.string().valid('Individual', 'Company').required(),
        status: Joi.boolean().optional(),
        created_by: Joi.number().integer().optional().allow(null),
      })
    )
    .min(1)
    .required(),
});