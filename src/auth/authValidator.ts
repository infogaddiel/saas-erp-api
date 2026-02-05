import Joi from 'joi';

export const loginSchema = Joi.object({
  mobile: Joi.string().max(20).required(),
  password: Joi.string().min(6).required(),
});

export const verifyOtpSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  otp: Joi.string().length(6).required(),
});