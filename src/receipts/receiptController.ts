import { Request, Response } from 'express';
import {
  createReceipt,
  deleteReceipt,
  getReceiptById,
  getReceipts,
  updateReceipt,
} from './receiptService';

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createReceipt(req.body);

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create receipt controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const date_from = (req.query.date_from as string) || undefined;
    const date_to = (req.query.date_to as string) || undefined;

    const result = await getReceipts(page, limit, {
      date_from,
      date_to,
    });

    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List receipts controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getReceiptById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get receipt controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateReceipt(id, req.body);

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Receipt not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update receipt controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteReceipt(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete receipt controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
