import { Request, Response } from 'express';
import {
  createTicket,
  getTickets,
  getTicketsForDropdown,
  getTicketById,
  getTicketStatuses,
  getTicketStatusHistory,
  updateTicket,
  deleteTicket,
  createTicketService,
  getTicketServices,
  getTicketServicesByCompany,
  getTicketServiceById,
  updateTicketService,
  deleteTicketService,
} from './ticketService';

const getUserId = (req: Request): number | null => {
  const rawUserId = req.user?.id;
  if (rawUserId == null) return null;
  const parsed = parseInt(String(rawUserId), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const getCompanyCode = (req: Request): string | null => {
  const code = req.user?.company_code;
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return /^[A-Z0-9]{3}$/.test(normalized) ? normalized : null;
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

    const result = await createTicket(
      {
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
      },
      getCompanyCode(req)
    );

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

export const dropdown = async (req: Request, res: Response) => {
  try {
    const ticket_number = (req.query.ticket_number as string) || undefined;
    const customer_id = req.query.customer_id ? parseInt(req.query.customer_id as string, 10) : undefined;
    const company_id = req.user?.company_id ?? null;

    const result = await getTicketsForDropdown(company_id, {
      ticket_number,
      customer_id,
    });
    if (!result.success) {
      const status = result.message === 'User company not found' ? 400 : 500;
      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown tickets controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const statuses = async (_req: Request, res: Response) => {
  try {
    const result = await getTicketStatuses();
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get ticket statuses controller error:', error);
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

export const createService = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const result = await createTicketService({
      ticket_id: ticketId,
      ...req.body,
    });

    if (!result.success) {
      const status =
        result.message === 'Ticket not found' ||
        result.message === 'User not found' ||
        result.message === 'Contract not found'
          ? 404
          : 500;
      return res.status(status).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create ticket service controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const listServices = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const result = await getTicketServices(ticketId);
    if (!result.success) {
      const status = result.message === 'Ticket not found' ? 404 : 500;
      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('List ticket services controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const listAllServices = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const rawCompanyId = req.user?.company_id;
    const companyId = rawCompanyId == null ? null : parseInt(String(rawCompanyId), 10);

    if (companyId == null || Number.isNaN(companyId)) {
      return res.status(400).json({ success: false, message: 'User company not found' });
    }

    const result = await getTicketServicesByCompany(companyId, page, limit);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List all ticket services controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const id = parseInt(req.params.serviceId, 10);
    const result = await getTicketServiceById(ticketId, id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get ticket service controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const id = parseInt(req.params.serviceId, 10);
    const result = await updateTicketService(ticketId, id, req.body);
    if (!result.success) {
      const status =
        result.message === 'Ticket service not found' ||
        result.message === 'User not found' ||
        result.message === 'Contract not found'
          ? 404
          : 500;
      return res.status(status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update ticket service controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const removeService = async (req: Request, res: Response) => {
  try {
    const ticketId = parseInt(req.params.ticketId, 10);
    const id = parseInt(req.params.serviceId, 10);
    const result = await deleteTicketService(ticketId, id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete ticket service controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
