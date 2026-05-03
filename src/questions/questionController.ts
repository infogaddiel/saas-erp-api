import { Request, Response } from 'express';
import { createQuestion, deleteQuestion, getQuestions, updateQuestion } from './questionService';

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createQuestion(req.body);
    if (!result.success) return res.status(500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create question controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};



export const list = async (_req: Request, res: Response) => {
  try {
    const result = await getQuestions();
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List questions controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateQuestion(id, req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Question not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update Question controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteQuestion(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete question controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
