import { Request, Response } from 'express';
import {
  createContract,
  deleteContract,
  getContractById,
  getContracts,
  updateContract,
} from './contractService';

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createContract(req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create contract controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
    const contract_number = (req.query.contract_number as string) || undefined;
    const contract_type = (req.query.contract_type as 'AMC' | 'Service' | 'Subscription') || undefined;
    const status = (req.query.status as 'Draft' | 'Active' | 'Expired' | 'Terminated') || undefined;

    const result = await getContracts(page, limit, {
      customer_id,
      contract_number,
      contract_type,
      status,
    });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List contracts controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getContractById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get contract controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateContract(id, req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Contract not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update contract controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteContract(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete contract controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
