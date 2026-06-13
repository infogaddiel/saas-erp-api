import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().max(100).optional().trim(),
  mobile: Joi.string().max(15).optional().trim(),
  password: Joi.string().min(6).required(),
}).or('email', 'mobile');

export const verifyOtpSchema = Joi.object({
  otp: Joi.string().length(6).required(),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().min(6).required(),
  new_password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'confirm_password must match new_password',
    }),
});

export const forgotPasswordRequestOtpSchema = Joi.object({
  mobile: Joi.string().max(15).required(),
});

export const forgotPasswordResetSchema = Joi.object({
  mobile: Joi.string().max(15).required(),
  otp: Joi.string().length(6).required(),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'confirm_password must match password',
    }),
});

export const registerSchema = Joi.object({
  company_name: Joi.string().max(255).required(),
  company_code: Joi.string()
    .trim()
    .uppercase()
    .alphanum()
    .length(3)
    .required(),
  name: Joi.string().max(255).required(),
  mobile: Joi.string().max(15).required(),
  email: Joi.string().email().max(100).optional().allow('', null),
  password: Joi.string().min(6).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({ 'any.only': 'confirm_password must match password' }),
});
