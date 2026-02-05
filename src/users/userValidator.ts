import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(15).required(),
  email: Joi.string().email().max(255).optional().allow(null, ''),
  password: Joi.string().min(6).required(),
  company_id: Joi.number().integer().positive().optional().allow(null),
  role_id: Joi.number().integer().positive().optional().allow(null),
  blocked: Joi.boolean().optional(),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  mobile: Joi.string().max(15).optional(),
  email: Joi.string().email().max(255).optional().allow(null, ''),
  password: Joi.string().min(6).optional(),
  company_id: Joi.number().integer().positive().optional().allow(null),
  role_id: Joi.number().integer().positive().optional().allow(null),
  blocked: Joi.boolean().optional(),
}).min(1);

export const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});