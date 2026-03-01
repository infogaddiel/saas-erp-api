import { Request, Response } from 'express';
import {
  createLead,
  createLeadStatus,
  deleteLead,
  deleteLeadStatus,
  getLeadById,
  getLeads,
  getLeadsForDropdown,
  getLeadStatusById,
  getLeadStatuses,
  getLeadStatusesForDropdown,
  getLeadStatusChangeHistory,
  updateLead,
  updateLeadCurrentStatus,
  updateLeadStatus,
} from './leadService';

const getUserId = (req: Request): number | null => {
  const rawUserId = req.user?.id;
  if (rawUserId == null) return null;
  const parsed = parseInt(String(rawUserId), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const create = async (req: Request, res: Response) => {
  try {
    const result = await createLead({
      ...req.body,
      created_by: getUserId(req),
    });
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create lead controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const lead_status_id = req.query.lead_status_id ? parseInt(req.query.lead_status_id as string, 10) : undefined;
    const title_of_lead = (req.query.title_of_lead as string) || undefined;
    const contact_person = (req.query.contact_person as string) || undefined;
    const company_name = (req.query.company_name as string) || undefined;
    const contact_no = (req.query.contact_no as string) || undefined;
    const lead_source = (req.query.lead_source as string) || undefined;

    const result = await getLeads(page, limit, {
      lead_status_id,
      title_of_lead,
      contact_person,
      company_name,
      contact_no,
      lead_source,
    });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List leads controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const dropdown = async (req: Request, res: Response) => {
  try {
    const title_of_lead = (req.query.title_of_lead as string) || undefined;
    const contact_person = (req.query.contact_person as string) || undefined;
    const company_name = (req.query.company_name as string) || undefined;
    const lead_status_id = req.query.lead_status_id ? parseInt(req.query.lead_status_id as string, 10) : undefined;

    const result = await getLeadsForDropdown({
      title_of_lead,
      contact_person,
      company_name,
      lead_status_id,
    });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown leads controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getLeadById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get lead controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateLead(id, {
      ...req.body,
      changed_by: getUserId(req),
    });
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Lead not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update lead controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const updateCurrentStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateLeadCurrentStatus(id, {
      lead_status_id: req.body.lead_status_id,
      changed_by: getUserId(req),
    });
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Lead not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update lead current status controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const statusHistory = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getLeadStatusChangeHistory(id);
    if (!result.success) return res.status(result.message === 'Lead not found' ? 404 : 500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lead status history controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteLead(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete lead controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const createStatus = async (req: Request, res: Response) => {
  try {
    const result = await createLeadStatus(req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }
    return res.status(201).json(result);
  } catch (error) {
    console.error('Create lead status controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const listStatuses = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);
    const name = (req.query.name as string) || undefined;

    const result = await getLeadStatuses(page, limit, { name });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('List lead statuses controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const statusDropdown = async (req: Request, res: Response) => {
  try {
    const name = (req.query.name as string) || undefined;
    const result = await getLeadStatusesForDropdown({ name });
    if (!result.success) return res.status(500).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown lead statuses controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getStatusById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getLeadStatusById(id);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get lead status controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await updateLeadStatus(id, req.body);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Lead status not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update lead status controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const removeStatus = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteLeadStatus(id);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Lead status not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete lead status controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
