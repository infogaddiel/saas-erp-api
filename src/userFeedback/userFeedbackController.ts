import { Request, Response } from 'express';
import {
  createUserFeedback,
  deleteUserFeedback,
  getUserFeedbacks,
  updateUserFeedback,
} from './userFeedbackService';

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createUserFeedback(req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create user feedback controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const user_id = req.query.user_id ? parseInt(req.query.user_id as string, 10) : undefined;
    const question_id = req.query.question_id ? parseInt(req.query.question_id as string, 10) : undefined;

    const result = await getUserFeedbacks(page, limit, { user_id, question_id });
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List user feedback controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateUserFeedback(id, req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'User feedback not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update user feedback controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteUserFeedback(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete user feedback controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
