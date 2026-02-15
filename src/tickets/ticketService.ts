import sequelize from '../config/database';
import { Op, UniqueConstraintError } from 'sequelize';
import { Ticket, User, Customer, Company, TicketStatus, TicketStatusHistory, TicketService as TicketServiceModel } from '../models';

/** Convert dd-mm-yyyy to YYYY-MM-DD for DATEONLY storage */
function parseScheduledDate(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const match = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
}

interface CreateTicketInput {
  customer_id: number;
  status_id?: number;
  service_address: string;
  priority?: string;
  service_type: string;
  assigned_technician_id?: number | null;
  scheduled_date?: string | null;
  equipment_type?: string | null;
  equipment_model?: string | null;
  issue_description: string;
  created_by?: number | null;
}

interface UpdateTicketInput extends Partial<CreateTicketInput> {
  changed_by?: number | null;
}

interface CreateTicketServiceInput {
  ticket_id: number;
  customer_id?: number | null;
  customer_name: string;
  email?: string | null;
  phone?: string | null;
  service_date?: string | null;
  service_address: string;
  service_type?: string;
  user_id?: number | null;
  equipment_type?: string | null;
  equipment_model?: string | null;
  work_performed?: string | null;
  parts_used?: string | null;
  labor_hours?: number;
  photos?: string[] | null;
  video?: string | null;
  customer_signature?: string | null;
  report_status?: string;
}

interface UpdateTicketServiceInput extends Partial<Omit<CreateTicketServiceInput, 'ticket_id'>> {}

const OPEN_STATUS_NAME = 'Open';
const DEFAULT_TICKET_PREFIX = 'TKT';
const TICKET_NUMBER_PADDING = 5;

async function getOpenStatusId(transaction?: any): Promise<number | null> {
  const [status] = await TicketStatus.findOrCreate({
    where: { name: OPEN_STATUS_NAME },
    defaults: { name: OPEN_STATUS_NAME },
    transaction,
  });
  return status?.id ?? null;
}

function parseDate(value: string | null | undefined): string | null {
  return parseScheduledDate(value);
}

function getCompanyPrefix(companyName: string | null | undefined): string {
  if (!companyName) return DEFAULT_TICKET_PREFIX;
  const normalized = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length === 0) return DEFAULT_TICKET_PREFIX;
  return normalized.slice(0, 3).padEnd(3, 'X');
}

async function getCompanyPrefixByUserId(userId: number | null | undefined, transaction?: any): Promise<string> {
  if (!userId) return DEFAULT_TICKET_PREFIX;

  const user = await User.findByPk(userId, {
    attributes: ['id', 'company_id'],
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    transaction,
  });

  const companyName = (user as any)?.company?.name as string | undefined;
  return getCompanyPrefix(companyName);
}

async function generateNextTicketNumber(createdBy: number | null | undefined, transaction?: any): Promise<string> {
  const prefix = await getCompanyPrefixByUserId(createdBy, transaction);

  const latestTicket = await Ticket.findOne({
    where: {
      ticket_number: {
        [Op.like]: `${prefix}%`,
      },
    },
    attributes: ['ticket_number'],
    order: [['id', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  let nextSequence = 1;
  const currentNumber = latestTicket?.ticket_number;
  if (currentNumber) {
    const match = currentNumber.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) nextSequence = parsed + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(TICKET_NUMBER_PADDING, '0')}`;
}

async function createTicketStatusHistory(
  ticketId: number,
  statusId: number,
  changedBy?: number | null,
  transaction?: any
) {
  await TicketStatusHistory.create(
    {
      ticket_id: ticketId,
      status_id: statusId,
      changed_by: changedBy ?? null,
    },
    { transaction }
  );
}

export const createTicket = async (data: CreateTicketInput) => {
  try {
    let ticket: Ticket | null = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        ticket = await sequelize.transaction(async (transaction) => {
          const statusId = data.status_id ?? (await getOpenStatusId(transaction));
          if (!statusId) throw new Error('Open ticket status not found');

          const ticketNumber = await generateNextTicketNumber(data.created_by, transaction);

          const createdTicket = await Ticket.create(
            {
              ticket_number: ticketNumber,
              customer_id: data.customer_id,
              status_id: statusId,
              service_address: data.service_address,
              priority: data.priority ?? 'Medium',
              service_type: data.service_type,
              assigned_technician_id: data.assigned_technician_id ?? null,
              scheduled_date: parseScheduledDate(data.scheduled_date ?? undefined),
              equipment_type: data.equipment_type ?? null,
              equipment_model: data.equipment_model ?? null,
              issue_description: data.issue_description,
              created_by: data.created_by ?? null,
            },
            { transaction }
          );

          await createTicketStatusHistory(createdTicket.id, statusId, data.created_by, transaction);
          return createdTicket;
        });
        break;
      } catch (error) {
        const isUniqueViolation = error instanceof UniqueConstraintError;
        if (!isUniqueViolation || attempt === 2) throw error;
      }
    }

    if (!ticket) return { success: false, message: 'Error creating ticket' };

    const withAssociations = await Ticket.findByPk(ticket.id, {
      include: [
        { model: TicketStatus, as: 'status', attributes: ['id', 'name'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'assignedTechnician', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createTicket error:', error);
    return { success: false, message: 'Error creating ticket' };
  }
};

export const getTickets = async (
  page = 1,
  limit = 20,
  filters?: {
    priority?: string;
    service_type?: string;
    assigned_technician_id?: number;
    customer_id?: number;
    status_id?: number;
  }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.service_type) where.service_type = filters.service_type;
    if (filters?.assigned_technician_id != null) where.assigned_technician_id = filters.assigned_technician_id;
    if (filters?.customer_id != null) where.customer_id = filters.customer_id;
    if (filters?.status_id != null) where.status_id = filters.status_id;

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [
        { model: TicketStatus, as: 'status', attributes: ['id', 'name'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'assignedTechnician', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        tickets: rows,
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
    console.error('getTickets error:', error);
    return { success: false, message: 'Error fetching tickets' };
  }
};

export const getTicketsForDropdown = async (
  companyId: number | null | undefined,
  filters?: {
    ticket_number?: string;
    customer_id?: number;
  }
) => {
  try {
    const where: any = {};
    const ticketNumber = filters?.ticket_number?.trim();

    if (ticketNumber) {
      where.ticket_number = { [Op.iLike]: `%${ticketNumber}%` };
    }
    if (filters?.customer_id != null) {
      where.customer_id = filters.customer_id;
    }

    const customerInclude: any = {
      model: Customer,
      as: 'customer',
      attributes: ['id', 'name'],
      required: true,
    };

    if (filters?.customer_id == null) {
      if (!companyId) return { success: false, message: 'User company not found' };
      customerInclude.include = [
        {
          model: User,
          as: 'createdBy',
          attributes: [],
          required: true,
          where: { company_id: companyId },
        },
      ];
    }

    const tickets = await Ticket.findAll({
      attributes: ['id', 'ticket_number', 'customer_id'],
      where,
      include: [customerInclude],
      order: [
        ['ticket_number', 'ASC'],
        ['id', 'DESC'],
      ],
    });

    return { success: true, data: tickets };
  } catch (error) {
    console.error('getTicketsForDropdown error:', error);
    return { success: false, message: 'Error fetching tickets for dropdown' };
  }
};

export const getTicketById = async (id: number) => {
  try {
    const ticket = await Ticket.findByPk(id, {
      include: [
        { model: TicketStatus, as: 'status', attributes: ['id', 'name'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'assignedTechnician', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!ticket) return { success: false, message: 'Ticket not found' };

    return { success: true, data: ticket };
  } catch (error) {
    console.error('getTicketById error:', error);
    return { success: false, message: 'Error fetching ticket' };
  }
};

export const getTicketStatuses = async () => {
  try {
    const statuses = await TicketStatus.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    return { success: true, data: statuses };
  } catch (error) {
    console.error('getTicketStatuses error:', error);
    return { success: false, message: 'Error fetching ticket statuses' };
  }
};

export const updateTicket = async (id: number, updates: UpdateTicketInput) => {
  try {
    await sequelize.transaction(async (transaction) => {
      const ticket = await Ticket.findByPk(id, { transaction });
      if (!ticket) throw new Error('Ticket not found');

      const previousStatusId = ticket.status_id;
      const payload: any = { ...updates };
      const changedBy = payload.changed_by ?? null;
      delete payload.changed_by;

      if (updates.scheduled_date !== undefined) {
        payload.scheduled_date = parseScheduledDate(updates.scheduled_date);
      }

      await ticket.update(payload, { transaction });

      if (payload.status_id !== undefined && payload.status_id !== previousStatusId) {
        await createTicketStatusHistory(id, payload.status_id, changedBy, transaction);
      }
    });

    const withAssociations = await Ticket.findByPk(id, {
      include: [
        { model: TicketStatus, as: 'status', attributes: ['id', 'name'] },
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'assignedTechnician', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updateTicket error:', error);
    if (error instanceof Error && error.message === 'Ticket not found') {
      return { success: false, message: 'Ticket not found' };
    }
    return { success: false, message: 'Error updating ticket' };
  }
};

export const getTicketStatusHistory = async (ticketId: number) => {
  try {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return { success: false, message: 'Ticket not found' };

    const history = await TicketStatusHistory.findAll({
      where: { ticket_id: ticketId },
      order: [
        ['changed_at', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        { model: TicketStatus, as: 'status', attributes: ['id', 'name'] },
        { model: User, as: 'changedBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('getTicketStatusHistory error:', error);
    return { success: false, message: 'Error fetching ticket status history' };
  }
};

export const deleteTicket = async (id: number) => {
  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return { success: false, message: 'Ticket not found' };

    await sequelize.transaction(async (transaction) => {
      await ticket.update({ deleted_at: new Date() } as any, { transaction });
      await TicketServiceModel.update(
        { deleted_at: new Date() } as any,
        { where: { ticket_id: id }, transaction }
      );
    });
    return { success: true, message: 'Ticket deleted' };
  } catch (error) {
    console.error('deleteTicket error:', error);
    return { success: false, message: 'Error deleting ticket' };
  }
};

export const createTicketService = async (data: CreateTicketServiceInput) => {
  try {
    const ticket = await Ticket.findByPk(data.ticket_id);
    if (!ticket) return { success: false, message: 'Ticket not found' };
    if (data.user_id != null) {
      const technician = await User.findByPk(data.user_id);
      if (!technician) return { success: false, message: 'User not found' };
    }

    const photoList = Array.isArray(data.photos) ? data.photos : [];
    const video = data.video && data.video.trim() !== '' ? data.video : null;
    const customerSignature =
      data.customer_signature && data.customer_signature.trim() !== '' ? data.customer_signature : null;
    const reportStatus = data.report_status && data.report_status.trim() !== '' ? data.report_status : 'Draft';

    const created = await TicketServiceModel.create({
      ticket_id: data.ticket_id,
      customer_id: data.customer_id ?? null,
      customer_name: data.customer_name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      service_date: parseDate(data.service_date ?? undefined),
      service_address: data.service_address,
      service_type: data.service_type ?? 'Repair',
      user_id: data.user_id ?? null,
      equipment_type: data.equipment_type ?? null,
      equipment_model: data.equipment_model ?? null,
      work_performed: data.work_performed ?? null,
      parts_used: data.parts_used ?? null,
      labor_hours: data.labor_hours ?? 0,
      photos: photoList,
      video,
      customer_signature: customerSignature,
      report_status: reportStatus,
    });

    return { success: true, data: created };
  } catch (error) {
    console.error('createTicketService error:', error);
    return { success: false, message: 'Error creating ticket service' };
  }
};

export const getTicketServices = async (ticketId: number) => {
  try {
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return { success: false, message: 'Ticket not found' };

    const services = await TicketServiceModel.findAll({
      where: { ticket_id: ticketId },
      order: [['id', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'mobile'] },
      ],
    });

    return { success: true, data: services };
  } catch (error) {
    console.error('getTicketServices error:', error);
    return { success: false, message: 'Error fetching ticket services' };
  }
};

export const getTicketServiceById = async (ticketId: number, id: number) => {
  try {
    const service = await TicketServiceModel.findOne({
      where: { id, ticket_id: ticketId },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'mobile'] },
      ],
    });
    if (!service) return { success: false, message: 'Ticket service not found' };

    return { success: true, data: service };
  } catch (error) {
    console.error('getTicketServiceById error:', error);
    return { success: false, message: 'Error fetching ticket service' };
  }
};

export const updateTicketService = async (ticketId: number, id: number, updates: UpdateTicketServiceInput) => {
  try {
    const service = await TicketServiceModel.findOne({
      where: { id, ticket_id: ticketId },
    });
    if (!service) return { success: false, message: 'Ticket service not found' };

    const payload: any = { ...updates };
    if (updates.user_id !== undefined && updates.user_id !== null) {
      const technician = await User.findByPk(updates.user_id);
      if (!technician) return { success: false, message: 'User not found' };
    }
    if (updates.service_date !== undefined) {
      payload.service_date = parseDate(updates.service_date);
    }
    if (updates.photos !== undefined) {
      payload.photos = Array.isArray(updates.photos) ? updates.photos : [];
    }

    await service.update(payload);

    return { success: true, data: service };
  } catch (error) {
    console.error('updateTicketService error:', error);
    return { success: false, message: 'Error updating ticket service' };
  }
};

export const deleteTicketService = async (ticketId: number, id: number) => {
  try {
    const service = await TicketServiceModel.findOne({
      where: { id, ticket_id: ticketId },
    });
    if (!service) return { success: false, message: 'Ticket service not found' };

    await service.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'Ticket service deleted' };
  } catch (error) {
    console.error('deleteTicketService error:', error);
    return { success: false, message: 'Error deleting ticket service' };
  }
};
