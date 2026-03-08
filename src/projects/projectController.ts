import { Request, Response } from 'express';
import {
  bulkCreateProjects,
  createProject,
  deleteProject,
  exportProjectsToExcel,
  getProjectById,
  getProjects,
  getProjectsForDropdown,
  updateProject,
} from './projectService';

const getUserId = (req: Request): number | null => {
  const rawUserId = req.user?.id;
  if (rawUserId == null) return null;
  const parsed = parseInt(String(rawUserId), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getCompanyCode = (req: Request): string | null => {
  const code = req.user?.company_code;
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z0-9]{3}$/.test(normalized) ? normalized : null;
};

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createProject(
      {
        ...req.body,
        created_by: getUserId(req),
      },
      getCompanyCode(req)
    );
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create project controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const bulkCreate = async (req: Request, res: Response) => {
  try {
    const { projects } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(projects)) {
      return res.status(400).json({ success: false, message: 'Expected "projects" array in body' });
    }

    const result = await bulkCreateProjects(projects, userId, getCompanyCode(req));
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 400;
      return res.status(statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Bulk create projects controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
    const status = (req.query.status as 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled') || undefined;
    const project_name = (req.query.project_name as string) || undefined;
    const project_manager = (req.query.project_manager as string) || undefined;

    const result = await getProjects(page, limit, {
      customer_id,
      status,
      project_name,
      project_manager,
    });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List projects controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getProjectById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get project controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const dropdown = async (req: Request, res: Response) => {
  try {
    const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
    const project_number = (req.query.project_number as string) || undefined;
    const project_name = (req.query.project_name as string) || undefined;
    const status = (req.query.status as 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled') || undefined;

    const result = await getProjectsForDropdown({
      customer_id,
      project_number,
      project_name,
      status,
    });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown projects controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateProject(id, req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Project not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update project controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteProject(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete project controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const result = await exportProjectsToExcel();
    if (!result.success || !result.data) return res.status(500).json(result);

    const filename = `projects-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await result.data.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export projects controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
