import { Request, Response } from 'express';
import {
  createPayment,
  deletePayment,
  getPaymentById,
  getPayments,
  updatePayment,
} from './paymentService';

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createPayment(req.body);

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create payment controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const payment_date_from = (req.query.payment_date_from as string) || undefined;
    const payment_date_to = (req.query.payment_date_to as string) || undefined;

    const result = await getPayments(page, limit, {
      payment_date_from,
      payment_date_to,
    });

    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List payments controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getPaymentById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get payment controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updatePayment(id, req.body);

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Payment not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update payment controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deletePayment(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete payment controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
