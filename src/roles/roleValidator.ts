import Joi from 'joi';

export const createRoleSchema = Joi.object({
  type: Joi.string().max(100).required(),
  level: Joi.number().integer().min(2).required(),
  is_active: Joi.boolean().optional(),
});

export const updateRoleSchema = Joi.object({
  type: Joi.string().max(100).optional(),
  level: Joi.number().integer().min(2).optional(),
  is_active: Joi.boolean().optional(),
}).min(1);
