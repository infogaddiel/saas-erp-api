import { Request, Response } from 'express';
import {
  createDebitNote,
  deleteDebitNote,
  exportDebitNotesToExcel,
  getDebitNoteById,
  getDebitNotes,
  updateDebitNote,
} from '../creditNotes/creditNoteService';
import { getCompanyCode } from '../utils/common';

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createDebitNote(req.body, getCompanyCode(req));

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create debit note controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const date_from = (req.query.date_from as string) || undefined;
    const date_to = (req.query.date_to as string) || undefined;

    const result = await getDebitNotes(page, limit, {
      date_from,
      date_to,
    });

    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List debit notes controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getDebitNoteById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get debit note controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateDebitNote(id, req.body);

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Debit note not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update debit note controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteDebitNote(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete debit note controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const date_from = (req.query.date_from as string) || undefined;
    const date_to = (req.query.date_to as string) || undefined;

    const result = await exportDebitNotesToExcel({ date_from, date_to });
    if (!result.success || !result.data) return res.status(500).json(result);

    const filename = `debit-notes-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await result.data.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export debit notes controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
