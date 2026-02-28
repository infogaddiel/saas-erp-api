import Joi from 'joi';

export const createLeadSchema = Joi.object({
  title_of_lead: Joi.string().trim().min(1).max(255).required(),
  contact_person: Joi.string().trim().min(1).max(255).required(),
  company_name: Joi.string().trim().max(255).optional().allow(null, ''),
  contact_no: Joi.string().trim().min(1).max(30).required(),
  address: Joi.string().trim().max(5000).optional().allow(null, ''),
  lead_source: Joi.string().trim().max(100).optional().allow(null, ''),
  lead_status_id: Joi.number().integer().positive().required(),
  product_required: Joi.string().trim().max(5000).optional().allow(null, ''),
});

export const updateLeadSchema = Joi.object({
  title_of_lead: Joi.string().trim().min(1).max(255).optional(),
  contact_person: Joi.string().trim().min(1).max(255).optional(),
  company_name: Joi.string().trim().max(255).optional().allow(null, ''),
  contact_no: Joi.string().trim().min(1).max(30).optional(),
  address: Joi.string().trim().max(5000).optional().allow(null, ''),
  lead_source: Joi.string().trim().max(100).optional().allow(null, ''),
  lead_status_id: Joi.number().integer().positive().optional(),
  product_required: Joi.string().trim().max(5000).optional().allow(null, ''),
}).min(1);

export const listLeadsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  lead_status_id: Joi.number().integer().positive().optional(),
  title_of_lead: Joi.string().trim().max(255).optional().allow(''),
  contact_person: Joi.string().trim().max(255).optional().allow(''),
  company_name: Joi.string().trim().max(255).optional().allow(''),
  contact_no: Joi.string().trim().max(30).optional().allow(''),
  lead_source: Joi.string().trim().max(100).optional().allow(''),
});

export const leadDropdownSchema = Joi.object({
  title_of_lead: Joi.string().trim().max(255).optional().allow(''),
  contact_person: Joi.string().trim().max(255).optional().allow(''),
  company_name: Joi.string().trim().max(255).optional().allow(''),
  lead_status_id: Joi.number().integer().positive().optional(),
});

export const createLeadStatusSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

export const updateLeadStatusSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
});

export const listLeadStatusesSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  name: Joi.string().trim().max(100).optional().allow(''),
});

export const leadStatusDropdownSchema = Joi.object({
  name: Joi.string().trim().max(100).optional().allow(''),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
