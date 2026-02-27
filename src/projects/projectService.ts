import sequelize from '../config/database';
import { Op, UniqueConstraintError } from 'sequelize';
import { Company, Customer, Project, User } from '../models';

interface CreateProjectInput {
  project_name: string;
  customer_id: number;
  project_manager?: string | null;
  start_date: string;
  end_date?: string | null;
  budget?: number;
  status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  description?: string | null;
  notes?: string | null;
  created_by?: number | null;
}

interface UpdateProjectInput extends Partial<CreateProjectInput> {}

const DEFAULT_PROJECT_PREFIX = 'PRJ';
const PROJECT_NUMBER_MIDDLE = 'PROJ';
const PROJECT_NUMBER_PADDING = 5;
const MAX_PROJECT_NUMBER_RETRIES = 3;

const projectInclude = [
  { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email'] },
];

const parseDate = (value: string | null | undefined): string | null => {
  if (value == null || value === '') return null;
  const match = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
};

const getCompanyPrefix = (companyName: string | null | undefined): string => {
  if (!companyName) return DEFAULT_PROJECT_PREFIX;
  const normalized = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length === 0) return DEFAULT_PROJECT_PREFIX;
  return normalized.slice(0, 3).padEnd(3, 'X');
};

const getCompanyPrefixByUserId = async (userId: number | null | undefined, transaction?: any): Promise<string> => {
  if (!userId) return DEFAULT_PROJECT_PREFIX;

  const user = await User.findByPk(userId, {
    attributes: ['id', 'company_id'],
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    transaction,
  });

  const companyName = (user as any)?.company?.name as string | undefined;
  return getCompanyPrefix(companyName);
};

const generateNextProjectNumber = async (createdBy: number | null | undefined, transaction?: any): Promise<string> => {
  const prefix = await getCompanyPrefixByUserId(createdBy, transaction);
  const numberPrefix = `${prefix}${PROJECT_NUMBER_MIDDLE}`;

  const latestProject = await Project.findOne({
    where: {
      project_number: {
        [Op.like]: `${numberPrefix}%`,
      },
    },
    attributes: ['project_number'],
    order: [['id', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  let nextSequence = 1;
  const currentNumber = latestProject?.project_number;
  if (currentNumber) {
    const match = currentNumber.match(new RegExp(`^${numberPrefix}(\\d+)$`));
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) nextSequence = parsed + 1;
    }
  }

  return `${numberPrefix}${String(nextSequence).padStart(PROJECT_NUMBER_PADDING, '0')}`;
};

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

export const createProject = async (data: CreateProjectInput) => {
  try {
    const customer = await Customer.findByPk(data.customer_id, { attributes: ['id'] });
    if (!customer) return { success: false, message: 'Customer not found', statusCode: 404 };

    let created: Project | null = null;

    for (let attempt = 0; attempt < MAX_PROJECT_NUMBER_RETRIES; attempt += 1) {
      try {
        created = await sequelize.transaction(async (transaction) => {
          const projectNumber = await generateNextProjectNumber(data.created_by, transaction);

          return Project.create({
            project_number: projectNumber,
            project_name: data.project_name.trim(),
            customer_id: data.customer_id,
            project_manager: normalizeOptionalText(data.project_manager),
            start_date: parseDate(data.start_date),
            end_date: parseDate(data.end_date),
            budget: data.budget ?? 0,
            status: data.status ?? 'Planning',
            description: normalizeOptionalText(data.description),
            notes: normalizeOptionalText(data.notes),
            created_by: data.created_by ?? null,
          }, { transaction });
        });

        break;
      } catch (error) {
        const isUniqueViolation = error instanceof UniqueConstraintError;
        if (!isUniqueViolation || attempt === MAX_PROJECT_NUMBER_RETRIES - 1) throw error;
      }
    }

    if (!created) return { success: false, message: 'Error creating project' };

    const withAssociations = await Project.findByPk(created.id, { include: projectInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createProject error:', error);
    return { success: false, message: 'Error creating project' };
  }
};

export const getProjects = async (
  page = 1,
  limit = 20,
  filters?: {
    customer_id?: number;
    status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
    project_name?: string;
    project_manager?: string;
  }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.customer_id != null) where.customer_id = filters.customer_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.project_name) where.project_name = { [Op.iLike]: `%${filters.project_name.trim()}%` };
    if (filters?.project_manager) where.project_manager = { [Op.iLike]: `%${filters.project_manager.trim()}%` };

    const { count, rows } = await Project.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: projectInclude,
    });

    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: {
        projects: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error('getProjects error:', error);
    return { success: false, message: 'Error fetching projects' };
  }
};

export const getProjectById = async (id: number) => {
  try {
    const project = await Project.findByPk(id, { include: projectInclude });
    if (!project) return { success: false, message: 'Project not found' };
    return { success: true, data: project };
  } catch (error) {
    console.error('getProjectById error:', error);
    return { success: false, message: 'Error fetching project' };
  }
};

export const getProjectsForDropdown = async (filters?: {
  customer_id?: number;
  project_number?: string;
  project_name?: string;
  status?: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
}) => {
  try {
    const where: any = {};

    if (filters?.customer_id != null) where.customer_id = filters.customer_id;
    if (filters?.project_number) where.project_number = { [Op.iLike]: `%${filters.project_number.trim()}%` };
    if (filters?.project_name) where.project_name = { [Op.iLike]: `%${filters.project_name.trim()}%` };
    if (filters?.status) where.status = filters.status;

    const projects = await Project.findAll({
      attributes: ['id', 'project_number', 'project_name', 'status'],
      where,
      order: [
        ['project_name', 'ASC'],
        ['id', 'DESC'],
      ],
    });

    return { success: true, data: projects };
  } catch (error) {
    console.error('getProjectsForDropdown error:', error);
    return { success: false, message: 'Error fetching projects for dropdown' };
  }
};

export const updateProject = async (id: number, updates: UpdateProjectInput) => {
  try {
    const project = await Project.findByPk(id);
    if (!project) return { success: false, message: 'Project not found' };

    if (updates.customer_id != null) {
      const customer = await Customer.findByPk(updates.customer_id, { attributes: ['id'] });
      if (!customer) return { success: false, message: 'Customer not found', statusCode: 404 };
    }

    const nextStartDate = updates.start_date ? parseDate(updates.start_date) : String(project.start_date);
    const nextEndDate =
      updates.end_date === undefined
        ? project.end_date
          ? String(project.end_date)
          : null
        : parseDate(updates.end_date);
    if (nextStartDate && nextEndDate && new Date(nextStartDate) > new Date(nextEndDate)) {
      return { success: false, message: 'end_date must be greater than or equal to start_date', statusCode: 400 };
    }

    const payload: any = { ...updates };
    if (updates.project_name !== undefined) payload.project_name = updates.project_name.trim();
    if (updates.project_manager !== undefined) payload.project_manager = normalizeOptionalText(updates.project_manager);
    if (updates.description !== undefined) payload.description = normalizeOptionalText(updates.description);
    if (updates.notes !== undefined) payload.notes = normalizeOptionalText(updates.notes);
    if (updates.start_date !== undefined) payload.start_date = parseDate(updates.start_date);
    if (updates.end_date !== undefined) payload.end_date = parseDate(updates.end_date);

    await project.update(payload);

    const withAssociations = await Project.findByPk(id, { include: projectInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updateProject error:', error);
    return { success: false, message: 'Error updating project' };
  }
};

export const deleteProject = async (id: number) => {
  try {
    const project = await Project.findByPk(id);
    if (!project) return { success: false, message: 'Project not found' };

    await project.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'Project deleted' };
  } catch (error) {
    console.error('deleteProject error:', error);
    return { success: false, message: 'Error deleting project' };
  }
};
