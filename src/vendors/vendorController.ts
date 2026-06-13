import { Request, Response } from 'express';
import {
  bulkCreateVendors,
  createVendor,
  deleteVendor,
  exportVendorsToExcel,
  getVendorById,
  getVendors,
  getVendorsForDropdown,
  updateVendor,
} from './vendorService';

const getUserId = (req: Request): number | null => {
  const rawUserId = req.user?.id;
  if (rawUserId == null) return null;
  const parsed = parseInt(String(rawUserId), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseBooleanQuery = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return undefined;
};

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createVendor({
      ...req.body,
      created_by: getUserId(req),
    });
    if (!result.success) return res.status(500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create vendor controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const search = (req.query.search as string) || undefined;
    const category = (req.query.category as string) || undefined;
    const status = parseBooleanQuery(req.query.status);

    const result = await getVendors(page, limit, search, category, status);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List vendors controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getVendorById(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get vendor controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateVendor(id, req.body);
    if (!result.success) return res.status(result.message === 'Vendor not found' ? 404 : 500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update vendor controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteVendor(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete vendor controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const dropdown = async (req: Request, res: Response) => {
  try {
    const searchText = (req.query.searchText as string) || undefined;
    const status = typeof req.query.status === 'boolean' ? req.query.status : undefined;

    const result = await getVendorsForDropdown({ searchText, status });
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown vendors controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const bulkCreate = async (req: Request, res: Response) => {
  try {
    const { vendors } = req.body;
    const userId = getUserId(req);

    if (!Array.isArray(vendors)) {
      return res.status(400).json({ success: false, message: 'Expected "vendors" array in body' });
    }

    const result = await bulkCreateVendors(vendors, userId);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 400;
      return res.status(statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Bulk create vendors controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const exportExcel = async (_req: Request, res: Response) => {
  try {
    const result = await exportVendorsToExcel();
    if (!result.success || !result.data) return res.status(500).json(result);

    const filename = `vendors-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await result.data.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export vendors controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
