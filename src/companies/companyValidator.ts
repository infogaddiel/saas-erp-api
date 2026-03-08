import Joi from 'joi';

const optionalString = Joi.string().max(255).optional().allow(null, '');
const optionalDate = Joi.date().iso().optional().allow(null, '');
const optionalAmount = Joi.number().precision(2).optional().allow(null);

export const createCompanySchema = Joi.object({
  name: Joi.string().max(255).required(),
  company_code: Joi.string().trim().uppercase().alphanum().length(3).required(),
  address: Joi.string().optional().allow(null, ''),
  branch1_address: Joi.string().optional().allow(null, ''),
  branch2_address: Joi.string().optional().allow(null, ''),
  branch3_address: Joi.string().optional().allow(null, ''),
  contract: Joi.string().optional().allow(null, ''),
  website_url: Joi.string().uri().max(255).optional().allow(null, ''),
  logo: optionalString,
  email: Joi.string().email().max(100).optional().allow(null, ''),
  mobile: Joi.string().max(15).optional().allow(null, ''),
  other_mobile: Joi.string().max(15).optional().allow(null, ''),
  status: Joi.boolean().optional(),
  is_otp_auth_required: Joi.boolean().optional(),
  license_number: optionalString,
  license_expiry_date: optionalDate,
  license_image: optionalString,
  license_type: optionalString,
  license_status: optionalString,
  license_renewal_date: optionalDate,
  license_renewal_amount: optionalAmount,
  license_renewal_status: optionalString,
  gst_number: optionalString,
  gst_certificate: optionalString,
  gst_certificate_expiry_date: optionalDate,
  gst_certificate_status: optionalString,
  gst_certificate_renewal_date: optionalDate,
  gst_certificate_renewal_amount: optionalAmount,
  gst_certificate_renewal_status: optionalString,
  pan_number: optionalString,
  pan_certificate: optionalString,
  pan_certificate_expiry_date: optionalDate,
  pan_certificate_status: optionalString,
  pan_certificate_renewal_date: optionalDate,
  pan_certificate_renewal_amount: optionalAmount,
  pan_certificate_renewal_status: optionalString,
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().max(255).optional(),
  company_code: Joi.string().trim().uppercase().alphanum().length(3).optional(),
  address: Joi.string().optional().allow(null, ''),
  branch1_address: Joi.string().optional().allow(null, ''),
  branch2_address: Joi.string().optional().allow(null, ''),
  branch3_address: Joi.string().optional().allow(null, ''),
  contract: Joi.string().optional().allow(null, ''),
  website_url: Joi.string().uri().max(255).optional().allow(null, ''),
  logo: optionalString,
  email: Joi.string().email().max(100).optional().allow(null, ''),
  mobile: Joi.string().max(15).optional().allow(null, ''),
  other_mobile: Joi.string().max(15).optional().allow(null, ''),
  status: Joi.boolean().optional(),
  is_otp_auth_required: Joi.boolean().optional(),
  license_number: optionalString,
  license_expiry_date: optionalDate,
  license_image: optionalString,
  license_type: optionalString,
  license_status: optionalString,
  license_renewal_date: optionalDate,
  license_renewal_amount: optionalAmount,
  license_renewal_status: optionalString,
  gst_number: optionalString,
  gst_certificate: optionalString,
  gst_certificate_expiry_date: optionalDate,
  gst_certificate_status: optionalString,
  gst_certificate_renewal_date: optionalDate,
  gst_certificate_renewal_amount: optionalAmount,
  gst_certificate_renewal_status: optionalString,
  pan_number: optionalString,
  pan_certificate: optionalString,
  pan_certificate_expiry_date: optionalDate,
  pan_certificate_status: optionalString,
  pan_certificate_renewal_date: optionalDate,
  pan_certificate_renewal_amount: optionalAmount,
  pan_certificate_renewal_status: optionalString,
}).min(1);

export const listCompaniesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

export const dropdownCompaniesSchema = Joi.object({
  searchText: Joi.string().max(255).optional().allow(''),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
