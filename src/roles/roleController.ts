import { Request, Response } from 'express';
import { getRoles, createRole, updateRole, deleteRole } from './roleService';

export const list = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id;
    if (!companyId) return res.status(400).json({ success: false, message: 'Company not found' });

    const result = await getRoles(companyId);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.company_id;
    const result = await createRole(req.body, userId, companyId);
    if (!result.success) {
      const status = result.message === 'Role with this name already exists' ? 409
        : result.message === 'Only Super Admin can create roles' ? 403 : 400;
      return res.status(status).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.company_id;
    const result = await updateRole(id, req.body, userId, companyId);
    if (!result.success) {
      const status = result.message === 'Only Super Admin can update roles' ? 403
        : result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;
    const companyId = (req as any).user?.company_id;
    const result = await deleteRole(id, userId, companyId);
    if (!result.success) {
      const status = result.message === 'Only Super Admin can delete roles' ? 403
        : result.message === 'Role not found' ? 404 : 400;
      return res.status(status).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
