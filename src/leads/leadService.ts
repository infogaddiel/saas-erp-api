import { Op } from 'sequelize';
import { Lead, LeadStatus, User } from '../models';

interface CreateLeadInput {
  title_of_lead: string;
  contact_person: string;
  company_name?: string | null;
  contact_no: string;
  address?: string | null;
  lead_source?: string | null;
  lead_status_id: number;
  product_required?: string | null;
  created_by?: number | null;
}

interface UpdateLeadInput extends Partial<CreateLeadInput> {}

interface CreateLeadStatusInput {
  name: string;
}

interface UpdateLeadStatusInput extends Partial<CreateLeadStatusInput> {}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const leadInclude = [
  { model: LeadStatus, as: 'leadStatus', attributes: ['id', 'name'] },
  { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
];

export const createLead = async (data: CreateLeadInput) => {
  try {
    const status = await LeadStatus.findByPk(data.lead_status_id, { attributes: ['id'] });
    if (!status) return { success: false, message: 'Lead status not found', statusCode: 404 };

    const created = await Lead.create({
      title_of_lead: data.title_of_lead.trim(),
      contact_person: data.contact_person.trim(),
      company_name: normalizeOptionalText(data.company_name),
      contact_no: data.contact_no.trim(),
      address: normalizeOptionalText(data.address),
      lead_source: normalizeOptionalText(data.lead_source),
      lead_status_id: data.lead_status_id,
      product_required: normalizeOptionalText(data.product_required),
      created_by: data.created_by ?? null,
    });

    const withAssociations = await Lead.findByPk(created.id, { include: leadInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createLead error:', error);
    return { success: false, message: 'Error creating lead' };
  }
};

export const getLeads = async (
  page = 1,
  limit = 20,
  filters?: {
    lead_status_id?: number;
    title_of_lead?: string;
    contact_person?: string;
    company_name?: string;
    contact_no?: string;
    lead_source?: string;
  }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.lead_status_id != null) where.lead_status_id = filters.lead_status_id;
    if (filters?.title_of_lead) where.title_of_lead = { [Op.iLike]: `%${filters.title_of_lead.trim()}%` };
    if (filters?.contact_person) where.contact_person = { [Op.iLike]: `%${filters.contact_person.trim()}%` };
    if (filters?.company_name) where.company_name = { [Op.iLike]: `%${filters.company_name.trim()}%` };
    if (filters?.contact_no) where.contact_no = { [Op.iLike]: `%${filters.contact_no.trim()}%` };
    if (filters?.lead_source) where.lead_source = { [Op.iLike]: `%${filters.lead_source.trim()}%` };

    const { count, rows } = await Lead.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: leadInclude,
    });

    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: {
        leads: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error('getLeads error:', error);
    return { success: false, message: 'Error fetching leads' };
  }
};

export const getLeadsForDropdown = async (filters?: {
  title_of_lead?: string;
  contact_person?: string;
  company_name?: string;
  lead_status_id?: number;
}) => {
  try {
    const where: any = {};

    if (filters?.title_of_lead) where.title_of_lead = { [Op.iLike]: `%${filters.title_of_lead.trim()}%` };
    if (filters?.contact_person) where.contact_person = { [Op.iLike]: `%${filters.contact_person.trim()}%` };
    if (filters?.company_name) where.company_name = { [Op.iLike]: `%${filters.company_name.trim()}%` };
    if (filters?.lead_status_id != null) where.lead_status_id = filters.lead_status_id;

    const leads = await Lead.findAll({
      attributes: ['id', 'title_of_lead', 'contact_person', 'company_name', 'lead_status_id'],
      where,
      include: [{ model: LeadStatus, as: 'leadStatus', attributes: ['id', 'name'] }],
      order: [
        ['title_of_lead', 'ASC'],
        ['id', 'DESC'],
      ],
    });

    return { success: true, data: leads };
  } catch (error) {
    console.error('getLeadsForDropdown error:', error);
    return { success: false, message: 'Error fetching leads for dropdown' };
  }
};

export const getLeadById = async (id: number) => {
  try {
    const lead = await Lead.findByPk(id, { include: leadInclude });
    if (!lead) return { success: false, message: 'Lead not found' };
    return { success: true, data: lead };
  } catch (error) {
    console.error('getLeadById error:', error);
    return { success: false, message: 'Error fetching lead' };
  }
};

export const updateLead = async (id: number, updates: UpdateLeadInput) => {
  try {
    const lead = await Lead.findByPk(id);
    if (!lead) return { success: false, message: 'Lead not found' };

    if (updates.lead_status_id != null) {
      const status = await LeadStatus.findByPk(updates.lead_status_id, { attributes: ['id'] });
      if (!status) return { success: false, message: 'Lead status not found', statusCode: 404 };
    }

    const payload: any = { ...updates };
    if (updates.title_of_lead !== undefined) payload.title_of_lead = updates.title_of_lead.trim();
    if (updates.contact_person !== undefined) payload.contact_person = updates.contact_person.trim();
    if (updates.contact_no !== undefined) payload.contact_no = updates.contact_no.trim();
    if (updates.company_name !== undefined) payload.company_name = normalizeOptionalText(updates.company_name);
    if (updates.address !== undefined) payload.address = normalizeOptionalText(updates.address);
    if (updates.lead_source !== undefined) payload.lead_source = normalizeOptionalText(updates.lead_source);
    if (updates.product_required !== undefined) payload.product_required = normalizeOptionalText(updates.product_required);

    await lead.update(payload);

    const withAssociations = await Lead.findByPk(id, { include: leadInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updateLead error:', error);
    return { success: false, message: 'Error updating lead' };
  }
};

export const deleteLead = async (id: number) => {
  try {
    const lead = await Lead.findByPk(id);
    if (!lead) return { success: false, message: 'Lead not found' };

    await lead.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'Lead deleted' };
  } catch (error) {
    console.error('deleteLead error:', error);
    return { success: false, message: 'Error deleting lead' };
  }
};

export const createLeadStatus = async (data: CreateLeadStatusInput) => {
  try {
    const created = await LeadStatus.create({
      name: data.name.trim(),
    });
    return { success: true, data: created };
  } catch (error: any) {
    console.error('createLeadStatus error:', error);
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return { success: false, message: 'Lead status already exists', statusCode: 400 };
    }
    return { success: false, message: 'Error creating lead status' };
  }
};

export const getLeadStatuses = async (page = 1, limit = 20, filters?: { name?: string }) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (filters?.name) where.name = { [Op.iLike]: `%${filters.name.trim()}%` };

    const { count, rows } = await LeadStatus.findAndCountAll({
      where,
      offset,
      limit,
      order: [['name', 'ASC']],
    });

    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: {
        statuses: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    };
  } catch (error) {
    console.error('getLeadStatuses error:', error);
    return { success: false, message: 'Error fetching lead statuses' };
  }
};

export const getLeadStatusesForDropdown = async (filters?: { name?: string }) => {
  try {
    const where: any = {};
    if (filters?.name) where.name = { [Op.iLike]: `%${filters.name.trim()}%` };

    const statuses = await LeadStatus.findAll({
      attributes: ['id', 'name'],
      where,
      order: [['name', 'ASC']],
    });

    return { success: true, data: statuses };
  } catch (error) {
    console.error('getLeadStatusesForDropdown error:', error);
    return { success: false, message: 'Error fetching lead statuses for dropdown' };
  }
};

export const getLeadStatusById = async (id: number) => {
  try {
    const status = await LeadStatus.findByPk(id);
    if (!status) return { success: false, message: 'Lead status not found' };
    return { success: true, data: status };
  } catch (error) {
    console.error('getLeadStatusById error:', error);
    return { success: false, message: 'Error fetching lead status' };
  }
};

export const updateLeadStatus = async (id: number, updates: UpdateLeadStatusInput) => {
  try {
    const status = await LeadStatus.findByPk(id);
    if (!status) return { success: false, message: 'Lead status not found' };

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();

    await status.update(payload);
    return { success: true, data: status };
  } catch (error: any) {
    console.error('updateLeadStatus error:', error);
    if (error?.name === 'SequelizeUniqueConstraintError') {
      return { success: false, message: 'Lead status already exists', statusCode: 400 };
    }
    return { success: false, message: 'Error updating lead status' };
  }
};

export const deleteLeadStatus = async (id: number) => {
  try {
    const status = await LeadStatus.findByPk(id);
    if (!status) return { success: false, message: 'Lead status not found' };

    const linkedLead = await Lead.findOne({ where: { lead_status_id: id }, attributes: ['id'] });
    if (linkedLead) {
      return { success: false, message: 'Lead status is used in leads', statusCode: 400 };
    }

    await status.destroy();
    return { success: true, message: 'Lead status deleted' };
  } catch (error) {
    console.error('deleteLeadStatus error:', error);
    return { success: false, message: 'Error deleting lead status' };
  }
};
