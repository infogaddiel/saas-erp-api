import Joi from 'joi';

export const createUserFeedbackSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  question_id: Joi.number().integer().positive().required(),
  feedback: Joi.string().trim().required(),
});

export const updateUserFeedbackSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
  question_id: Joi.number().integer().positive().optional(),
  feedback: Joi.string().trim().optional(),
}).min(1);

export const listUserFeedbackSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  user_id: Joi.number().integer().positive().optional(),
  question_id: Joi.number().integer().positive().optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
