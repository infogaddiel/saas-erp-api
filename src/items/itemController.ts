import { Request, Response } from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  bulkCreateItems,
  exportItemsToExcel,
} from './itemService';

export const create = async (req: Request, res: Response) => {
  try {
    const {
      item_code,
      item_name,
      description,
      type,
      category,
      unit_price,
      gst_percentage,
      unit,
      stock_quantity,
      notes,
      status,
      created_by,
    } = req.body;

    const result = await createItem({
      item_code,
      item_name,
      description,
      type,
      category,
      unit_price,
      gst_percentage,
      unit,
      stock_quantity,
      notes,
      status,
      created_by,
    });

    if (!result.success) return res.status(500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create item controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const name = (req.query.name as string) || undefined;

    const result = await getItems(page, limit, name);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List items controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getItemById(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get item controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    const result = await updateItem(id, updates);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update item controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteItem(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete item controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const bulkCreate = async (req: Request, res: Response) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Expected "items" array in body' });
    }

    const result = await bulkCreateItems(items);
    if (!result.success) return res.status(400).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Bulk create items controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const result = await exportItemsToExcel();
    if (!result.success || !result.data) return res.status(500).json(result);

    const filename = `items-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await result.data.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export items controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

