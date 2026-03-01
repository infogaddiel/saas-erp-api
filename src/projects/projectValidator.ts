import Joi from 'joi';

const PROJECT_STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as const;

const dateSchema = Joi.string()
  .pattern(/^\d{2}-\d{2}-\d{4}$/)
  .optional()
  .allow(null, '')
  .custom((value, helpers) => {
    if (value == null || value === '') return value;
    const [d, m, y] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return helpers.error('date.invalid');
    }
    return value;
  }, 'dd-mm-yyyy date validation')
  .messages({ 'date.invalid': 'date must be a valid date in dd-mm-yyyy format' });

const projectPayloadSchema = Joi.object({
  project_name: Joi.string().trim().min(1).max(255).required(),
  customer_id: Joi.number().integer().positive().required(),
  project_manager: Joi.string().trim().max(255).optional().allow(null, ''),
  start_date: dateSchema.required(),
  end_date: dateSchema,
  budget: Joi.number().min(0).optional().default(0),
  status: Joi.string()
    .valid(...PROJECT_STATUSES)
    .optional()
    .default('Planning'),
  description: Joi.string().trim().max(10000).optional().allow(null, ''),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
}).custom((value, helpers) => {
  if (!value.start_date || !value.end_date) return value;
  const [sd, sm, sy] = value.start_date.split('-').map(Number);
  const [ed, em, ey] = value.end_date.split('-').map(Number);
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);
  if (endDate < startDate) {
    return helpers.message({ custom: 'end_date must be greater than or equal to start_date' });
  }
  return value;
});

export const createProjectSchema = projectPayloadSchema;

export const updateProjectSchema = Joi.object({
  project_name: Joi.string().trim().min(1).max(255).optional(),
  customer_id: Joi.number().integer().positive().optional(),
  project_manager: Joi.string().trim().max(255).optional().allow(null, ''),
  start_date: dateSchema,
  end_date: dateSchema,
  budget: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid(...PROJECT_STATUSES)
    .optional(),
  description: Joi.string().trim().max(10000).optional().allow(null, ''),
  notes: Joi.string().trim().max(10000).optional().allow(null, ''),
})
  .min(1)
  .custom((value, helpers) => {
    if (!value.start_date || !value.end_date) return value;
    const [sd, sm, sy] = value.start_date.split('-').map(Number);
    const [ed, em, ey] = value.end_date.split('-').map(Number);
    const startDate = new Date(sy, sm - 1, sd);
    const endDate = new Date(ey, em - 1, ed);
    if (endDate < startDate) {
      return helpers.message({ custom: 'end_date must be greater than or equal to start_date' });
    }
    return value;
  });

export const listProjectsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  customer_id: Joi.number().integer().positive().optional(),
  status: Joi.string()
    .valid(...PROJECT_STATUSES)
    .optional(),
  project_name: Joi.string().trim().max(255).optional().allow(''),
  project_manager: Joi.string().trim().max(255).optional().allow(''),
});

export const projectDropdownSchema = Joi.object({
  customer_id: Joi.number().integer().positive().optional(),
  project_number: Joi.string().trim().max(50).optional().allow(''),
  project_name: Joi.string().trim().max(255).optional().allow(''),
  status: Joi.string()
    .valid(...PROJECT_STATUSES)
    .optional(),
});

export const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const bulkCreateProjectsSchema = Joi.object({
  projects: Joi.array().items(projectPayloadSchema).min(1).required(),
});
