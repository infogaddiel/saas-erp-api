import { Request, Response } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersForDropdown,
  getDashboardSummary,
} from './userService';

export const create = async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, password, company_id, role_id, blocked, menu_ids } = req.body;

    const result = await createUser({ name, mobile, email, password, company_id, role_id, blocked, menu_ids });
    if (!result.success) return res.status(400).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create user controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const userId = (req as any).user?.id;
    const roleId = (req as any).user?.role_id;

    const result = await getUsers(page, limit, userId,roleId);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List users controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getUserById(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    const result = await updateUser(id, updates);
    if (!result.success) return res.status(400).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update user controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteUser(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete user controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const dropdown = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'User company not found' });
    }

    const roleId = req.query.role_id ? parseInt(req.query.role_id as string, 10) : undefined;

    const result = await getUsersForDropdown(companyId, roleId);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown users controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const dashboard = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'User company not found' });
    }

    const result = await getDashboardSummary(companyId);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Dashboard summary controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
