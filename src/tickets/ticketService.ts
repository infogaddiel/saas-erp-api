import { Ticket, User, Customer } from '../models';

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

export const createTicket = async (data: CreateTicketInput) => {
  try {
    const ticket = await Ticket.create({
      customer_id: data.customer_id,
      service_address: data.service_address,
      priority: data.priority ?? 'Medium',
      service_type: data.service_type,
      assigned_technician_id: data.assigned_technician_id ?? null,
      scheduled_date: parseScheduledDate(data.scheduled_date ?? undefined),
      equipment_type: data.equipment_type ?? null,
      equipment_model: data.equipment_model ?? null,
      issue_description: data.issue_description,
      created_by: data.created_by ?? null,
    });

    const withAssociations = await Ticket.findByPk(ticket.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'assignedTechnician', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    return { success: true, data: withAssociations ?? ticket };
  } catch (error) {
    console.error('createTicket error:', error);
    return { success: false, message: 'Error creating ticket' };
  }
};

export const getTickets = async (
  page = 1,
  limit = 20,
  filters?: { priority?: string; service_type?: string; assigned_technician_id?: number; customer_id?: number }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.service_type) where.service_type = filters.service_type;
    if (filters?.assigned_technician_id != null) where.assigned_technician_id = filters.assigned_technician_id;
    if (filters?.customer_id != null) where.customer_id = filters.customer_id;

    const { count, rows } = await Ticket.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [
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

export const updateTicket = async (id: number, updates: Partial<CreateTicketInput>) => {
  try {
    const ticket = await Ticket.findByPk(id);
    if (!ticket) return { success: false, message: 'Ticket not found' };

    const payload: any = { ...updates };
    if (updates.scheduled_date !== undefined) {
      payload.scheduled_date = parseScheduledDate(updates.scheduled_date);
    }

    await ticket.update(payload);

    const withAssociations = await Ticket.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email', 'address', 'type'] },
        { model: User, as: 'assignedTechnician', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
    });

    return { success: true, data: withAssociations ?? ticket };
  } catch (error) {
    console.error('updateTicket error:', error);
    return { success: false, message: 'Error updating ticket' };
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
