import sequelize from '../config/database';
import { Ticket, User, Customer, TicketStatus, TicketStatusHistory } from '../models';

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

const OPEN_STATUS_NAME = 'Open';

async function getOpenStatusId(transaction?: any): Promise<number | null> {
  const [status] = await TicketStatus.findOrCreate({
    where: { name: OPEN_STATUS_NAME },
    defaults: { name: OPEN_STATUS_NAME },
    transaction,
  });
  return status?.id ?? null;
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
    const ticket = await sequelize.transaction(async (transaction) => {
      const statusId = data.status_id ?? (await getOpenStatusId(transaction));
      if (!statusId) throw new Error('Open ticket status not found');

      const createdTicket = await Ticket.create(
        {
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

    await ticket.destroy();
    return { success: true, message: 'Ticket deleted' };
  } catch (error) {
    console.error('deleteTicket error:', error);
    return { success: false, message: 'Error deleting ticket' };
  }
};
