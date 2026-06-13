import Joi from 'joi';

export const createVendorSchema = Joi.object({
  vendor_name: Joi.string().max(255).required(),
  company: Joi.string().max(255).allow(null, '').optional(),
  email: Joi.string().email().max(255).allow(null, '').optional(),
  phone: Joi.string().max(20).allow(null, '').optional(),
  category: Joi.string().max(100).allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  notes: Joi.string().allow(null, '').optional(),
  status: Joi.boolean().optional().default(true),
  created_by: Joi.number().integer().optional().allow(null),
});

export const updateVendorSchema = Joi.object({
  vendor_name: Joi.string().max(255).optional(),
  company: Joi.string().max(255).allow(null, '').optional(),
  email: Joi.string().email().max(255).allow(null, '').optional(),
  phone: Joi.string().max(20).allow(null, '').optional(),
  category: Joi.string().max(100).allow(null, '').optional(),
  address: Joi.string().allow(null, '').optional(),
  notes: Joi.string().allow(null, '').optional(),
  status: Joi.boolean().optional(),
}).min(1);

export const listVendorsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  search: Joi.string().max(255).optional(),
  category: Joi.string().max(100).optional(),
  status: Joi.boolean().optional(),
});

export const dropdownVendorsSchema = Joi.object({
  searchText: Joi.string().max(255).optional().allow(''),
  status: Joi.boolean().optional().default(true),
});

export const bulkCreateVendorsSchema = Joi.object({
  vendors: Joi.array()
    .items(
      Joi.object({
        vendor_name: Joi.string().max(255).required(),
        company: Joi.string().max(255).allow(null, '').optional(),
        email: Joi.string().email().max(255).allow(null, '').optional(),
        phone: Joi.string().max(20).allow(null, '').optional(),
        category: Joi.string().max(100).allow(null, '').optional(),
        address: Joi.string().allow(null, '').optional(),
        notes: Joi.string().allow(null, '').optional(),
        status: Joi.boolean().optional(),
        created_by: Joi.number().integer().optional().allow(null),
      })
    )
    .min(1)
    .required(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});
