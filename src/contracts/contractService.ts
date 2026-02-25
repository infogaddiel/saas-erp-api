import sequelize from '../config/database';
import { Op, Transaction, UniqueConstraintError } from 'sequelize';
import {
  Contract,
  ContractItem,
  ContractInvoice,
  Customer,
  Item,
  ServiceSchedule,
  User,
} from '../models';

interface CreateServiceScheduleInput {
  planned_date: string;
  actual_date?: string | null;
  service_status?: 'Scheduled' | 'In-Progress' | 'Completed' | 'Cancelled';
  technician_id?: number | null;
  service_notes?: string | null;
}

interface CreateContractItemInput {
  item_id: number;
  asset_id?: number | null;
  quantity?: number;
  unit_price: number;
  billing_frequency: 'One-time' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
  is_renewable?: boolean;
  service_schedules?: CreateServiceScheduleInput[];
}

interface CreateContractInvoiceInput {
  scheduled_billing_date: string;
  amount_to_bill: number;
  invoice_reference?: string | null;
  billing_status?: 'Pending' | 'Invoiced' | 'Paid';
}

interface CreateContractInput {
  customer_id: number;
  contract_type: 'AMC' | 'Service' | 'Subscription';
  status?: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  start_date: string;
  end_date: string;
  total_value?: number;
  currency?: string;
  line_items?: CreateContractItemInput[];
  invoices?: CreateContractInvoiceInput[];
}

interface UpdateContractInput extends Partial<CreateContractInput> {
  contract_number?: string;
}

const CONTRACT_NUMBER_PREFIX = 'CONT';
const CONTRACT_NUMBER_PADDING = 3;
const MAX_CONTRACT_NUMBER_RETRIES = 3;

const contractInclude = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email'] },
  {
    model: ContractItem,
    as: 'lineItems',
    include: [
      { model: Item, as: 'item', attributes: ['id', 'item_name', 'item_code'] },
      {
        model: ServiceSchedule,
        as: 'serviceSchedules',
        include: [{ model: User, as: 'technician', attributes: ['id', 'name', 'email'] }],
      },
    ],
  },
  { model: ContractInvoice, as: 'invoices' },
];

const calculateTotalValue = (lineItems: CreateContractItemInput[]): number => {
  return lineItems.reduce((sum, item) => sum + (item.quantity ?? 1) * item.unit_price, 0);
};

const generateNextContractNumber = async (transaction: Transaction): Promise<string> => {
  const latestContract = await Contract.findOne({
    where: {
      contract_number: {
        [Op.iLike]: `${CONTRACT_NUMBER_PREFIX}%`,
      },
    },
    attributes: ['contract_number'],
    order: [['id', 'DESC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  let nextSequence = 1;
  const currentNumber = latestContract?.contract_number;
  if (currentNumber) {
    const match = String(currentNumber).match(new RegExp(`^${CONTRACT_NUMBER_PREFIX}(\\d+)$`, 'i'));
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) nextSequence = parsed + 1;
    }
  }

  return `${CONTRACT_NUMBER_PREFIX}${String(nextSequence).padStart(CONTRACT_NUMBER_PADDING, '0')}`;
};

const createLineItemsAndSchedules = async (
  contractId: number,
  lineItems: CreateContractItemInput[],
  transaction: Transaction
) => {
  for (const lineItem of lineItems) {
    const createdLineItem = await ContractItem.create(
      {
        contract_id: contractId,
        item_id: lineItem.item_id,
        asset_id: lineItem.asset_id ?? null,
        quantity: lineItem.quantity ?? 1,
        unit_price: lineItem.unit_price,
        billing_frequency: lineItem.billing_frequency,
        is_renewable: lineItem.is_renewable ?? true,
      },
      { transaction }
    );

    const serviceSchedules = lineItem.service_schedules ?? [];
    if (serviceSchedules.length > 0) {
      await ServiceSchedule.bulkCreate(
        serviceSchedules.map((schedule) => ({
          id: createdLineItem.id,
          planned_date: schedule.planned_date,
          actual_date: schedule.actual_date ?? null,
          service_status: schedule.service_status ?? 'Scheduled',
          technician_id: schedule.technician_id ?? null,
          service_notes: schedule.service_notes ?? null,
        })),
        { transaction }
      );
    }
  }
};

const createInvoices = async (
  contractId: number,
  invoices: CreateContractInvoiceInput[],
  transaction: Transaction
) => {
  if (invoices.length === 0) return;
  await ContractInvoice.bulkCreate(
    invoices.map((invoice) => ({
      id: contractId,
      scheduled_billing_date: invoice.scheduled_billing_date,
      amount_to_bill: invoice.amount_to_bill,
      invoice_reference: invoice.invoice_reference ?? null,
      billing_status: invoice.billing_status ?? 'Pending',
    })),
    { transaction }
  );
};

export const createContract = async (data: CreateContractInput) => {
  try {
    const customer = await Customer.findByPk(data.customer_id, { attributes: ['id'] });
    if (!customer) return { success: false, message: 'Customer not found', statusCode: 404 };

    const lineItems = data.line_items ?? [];
    const invoices = data.invoices ?? [];
    const derivedTotal = calculateTotalValue(lineItems);
    const totalValue = data.total_value ?? derivedTotal;

    let created: Contract | null = null;
    for (let attempt = 0; attempt < MAX_CONTRACT_NUMBER_RETRIES; attempt += 1) {
      try {
        created = await sequelize.transaction(async (transaction) => {
          const contractNumber = await generateNextContractNumber(transaction);

          const contract = await Contract.create(
            {
              customer_id: data.customer_id,
              contract_number: contractNumber,
              contract_type: data.contract_type,
              status: data.status ?? 'Draft',
              start_date: data.start_date,
              end_date: data.end_date,
              total_value: totalValue,
              currency: (data.currency ?? 'INR').toUpperCase(),
            },
            { transaction }
          );

          await createLineItemsAndSchedules(contract.id, lineItems, transaction);
          await createInvoices(contract.id, invoices, transaction);

          return contract;
        });

        break;
      } catch (error) {
        const isUniqueViolation = error instanceof UniqueConstraintError;
        if (!isUniqueViolation || attempt === MAX_CONTRACT_NUMBER_RETRIES - 1) throw error;
      }
    }

    if (!created) return { success: false, message: 'Error creating contract' };

    const withAssociations = await Contract.findByPk(created.id, { include: contractInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createContract error:', error);
    return { success: false, message: 'Error creating contract' };
  }
};

export const getContracts = async (
  page = 1,
  limit = 20,
  filters?: {
    customer_id?: number;
    contract_number?: string;
    contract_type?: 'AMC' | 'Service' | 'Subscription';
    status?: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.customer_id != null) where.customer_id = filters.customer_id;
    if (filters?.contract_type) where.contract_type = filters.contract_type;
    if (filters?.status) where.status = filters.status;
    if (filters?.contract_number) {
      where.contract_number = { [Op.iLike]: `%${filters.contract_number.trim()}%` };
    }

    const count = await Contract.count({ where });

    const pagedContracts = await Contract.findAll({
      where,
      attributes: ['id'],
      offset,
      limit,
      order: [['id', 'DESC']],
      raw: true,
    });

    const contractIds = pagedContracts.map((contract: any) => contract.id);

    const rows =
      contractIds.length > 0
        ? await Contract.findAll({
            where: { id: contractIds },
            order: [['id', 'DESC']],
            include: contractInclude,
          })
        : [];

    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: {
        contracts: rows,
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
    console.error('getContracts error:', error);
    return { success: false, message: 'Error fetching contracts' };
  }
};

export const getContractById = async (id: number) => {
  try {
    const contract = await Contract.findByPk(id, { include: contractInclude });
    if (!contract) return { success: false, message: 'Contract not found' };
    return { success: true, data: contract };
  } catch (error) {
    console.error('getContractById error:', error);
    return { success: false, message: 'Error fetching contract' };
  }
};

export const updateContract = async (id: number, updates: UpdateContractInput) => {
  try {
    const contract = await Contract.findByPk(id);
    if (!contract) return { success: false, message: 'Contract not found' };

    if (updates.customer_id != null) {
      const customer = await Customer.findByPk(updates.customer_id, { attributes: ['id'] });
      if (!customer) return { success: false, message: 'Customer not found', statusCode: 404 };
    }

    if (updates.contract_number) {
      const normalizedContractNumber = updates.contract_number.trim();
      const existingContract = await Contract.findOne({
        where: {
          contract_number: { [Op.iLike]: normalizedContractNumber },
          id: { [Op.ne]: id },
        },
        attributes: ['id'],
      });
      if (existingContract) {
        return { success: false, message: 'Contract number already exists', statusCode: 409 };
      }
      updates.contract_number = normalizedContractNumber;
    }

    const nextStartDate = updates.start_date ?? String(contract.start_date);
    const nextEndDate = updates.end_date ?? String(contract.end_date);
    if (new Date(nextStartDate) > new Date(nextEndDate)) {
      return { success: false, message: 'end_date must be greater than or equal to start_date', statusCode: 400 };
    }

    await sequelize.transaction(async (transaction) => {
      const payload: any = { ...updates };
      delete payload.line_items;
      delete payload.invoices;

      if (payload.currency) payload.currency = String(payload.currency).toUpperCase();

      if (updates.line_items && updates.total_value == null) {
        payload.total_value = calculateTotalValue(updates.line_items);
      }

      await contract.update(payload, { transaction });

      if (updates.line_items) {
        await ContractItem.destroy({ where: { id: id }, transaction });
        await createLineItemsAndSchedules(id, updates.line_items, transaction);
      }

      if (updates.invoices) {
        await ContractInvoice.destroy({ where: { id: id }, transaction });
        await createInvoices(id, updates.invoices, transaction);
      }
    });

    const withAssociations = await Contract.findByPk(id, { include: contractInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updateContract error:', error);
    return { success: false, message: 'Error updating contract' };
  }
};

export const deleteContract = async (id: number) => {
  try {
    const contract = await Contract.findByPk(id);
    if (!contract) return { success: false, message: 'Contract not found' };

    await sequelize.transaction(async (transaction) => {
      await ContractInvoice.destroy({ where: { id: id }, transaction });
      await contract.destroy({ transaction });
    });

    return { success: true, message: 'Contract deleted' };
  } catch (error) {
    console.error('deleteContract error:', error);
    return { success: false, message: 'Error deleting contract' };
  }
};
