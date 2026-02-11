import { Request, Response } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  getTicketStatusHistory,
  updateTicket,
  deleteTicket,
} from './ticketService';

const getUserId = (req: Request): number | null => {
  const rawUserId = req.user?.id;
  if (rawUserId == null) return null;
  const parsed = parseInt(String(rawUserId), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const create = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      status_id,
      service_address,
      priority,
      service_type,
      assigned_technician_id,
      scheduled_date,
      equipment_type,
      equipment_model,
      issue_description,
    } = req.body;

    const result = await createTicket({
      customer_id,
      status_id,
      service_address,
      priority,
      service_type,
      assigned_technician_id,
      scheduled_date,
      equipment_type,
      equipment_model,
      issue_description,
      created_by: getUserId(req),
    });

    if (!result.success) return res.status(500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create ticket controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const priority = (req.query.priority as string) || undefined;
    const service_type = (req.query.service_type as string) || undefined;
    const assigned_technician_id = req.query.assigned_technician_id
      ? parseInt(req.query.assigned_technician_id as string, 10)
      : undefined;
    const customer_id = req.query.customer_id
      ? parseInt(req.query.customer_id as string, 10)
      : undefined;
    const status_id = req.query.status_id
      ? parseInt(req.query.status_id as string, 10)
      : undefined;

    const result = await getTickets(page, limit, {
      priority,
      service_type,
      assigned_technician_id,
      customer_id,
      status_id,
    });

    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List tickets controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getTicketById(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get ticket controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = {
      ...req.body,
      changed_by: getUserId(req),
    };

    const result = await updateTicket(id, updates);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update ticket controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const statusHistory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getTicketStatusHistory(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Ticket status history controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteTicket(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete ticket controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
