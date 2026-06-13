import Joi from 'joi';

export const createQuestionSchema = Joi.object({
  question: Joi.string().trim().required(),
  type: Joi.string().max(255).optional().allow(null, ''),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
