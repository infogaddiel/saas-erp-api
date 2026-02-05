import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().max(100).required(),
  password: Joi.string().min(6).required(),
});

export const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(6).required(),
});