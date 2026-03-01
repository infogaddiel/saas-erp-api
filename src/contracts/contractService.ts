import sequelize from '../config/database';
import { Op, Transaction, UniqueConstraintError } from 'sequelize';
import ExcelJS from 'exceljs';
import {
  Company,
  Contract,
  ContractItem,
  ContractInvoice,
  Customer,
  Item,
  Project,
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
  name: string;
  description?: string | null;
  customer_id: number;
  project_id: number;
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

const DEFAULT_CONTRACT_PREFIX = 'CON';
const CONTRACT_NUMBER_PADDING = 3;
const MAX_CONTRACT_NUMBER_RETRIES = 3;

const contractInclude = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email'] },
  { model: Project, as: 'project', attributes: ['id', 'project_number', 'project_name', 'status', 'customer_id'] },
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

const getCompanyPrefix = (companyName: string | null | undefined): string => {
  if (!companyName) return DEFAULT_CONTRACT_PREFIX;
  const normalized = companyName.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length === 0) return DEFAULT_CONTRACT_PREFIX;
  return normalized.slice(0, 3).padEnd(3, 'X');
};

const getCompanyPrefixByCustomerId = async (
  customerId: number,
  transaction: Transaction
): Promise<string> => {
  const customer = await Customer.findByPk(customerId, {
    attributes: ['id'],
    include: [
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'company_id'],
        required: false,
        include: [{ model: Company, as: 'company', attributes: ['id', 'name'], required: false }],
      },
    ],
    transaction,
  });

  const companyName = (customer as any)?.createdBy?.company?.name as string | undefined;
  return getCompanyPrefix(companyName);
};

const generateNextContractNumber = async (customerId: number, transaction: Transaction): Promise<string> => {
  const prefix = await getCompanyPrefixByCustomerId(customerId, transaction);

  const latestContract = await Contract.findOne({
    where: {
      contract_number: {
        [Op.iLike]: `${prefix}%`,
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
    const match = String(currentNumber).match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) nextSequence = parsed + 1;
    }
  }

  return `${prefix}CONT${String(nextSequence).padStart(CONTRACT_NUMBER_PADDING, '0')}`;
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
    const project = await Project.findByPk(data.project_id, { attributes: ['id', 'customer_id'] });
    if (!project) return { success: false, message: 'Project not found', statusCode: 404 };
    if ((project as any).customer_id !== data.customer_id) {
      return { success: false, message: 'Project does not belong to the provided customer', statusCode: 400 };
    }

    const contractName = data.name.trim();
    const contractDescription = data.description?.trim() ? data.description.trim() : null;
    const lineItems = data.line_items ?? [];
    const invoices = data.invoices ?? [];
    const derivedTotal = calculateTotalValue(lineItems);
    const totalValue = data.total_value ?? derivedTotal;

    let created: Contract | null = null;
    for (let attempt = 0; attempt < MAX_CONTRACT_NUMBER_RETRIES; attempt += 1) {
      try {
        created = await sequelize.transaction(async (transaction) => {
          const contractNumber = await generateNextContractNumber(data.customer_id, transaction);

          const contract = await Contract.create(
            {
              name: contractName,
              description: contractDescription,
              customer_id: data.customer_id,
              project_id: data.project_id,
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
    project_id?: number;
    contract_number?: string;
    contract_type?: 'AMC' | 'Service' | 'Subscription';
    status?: 'Draft' | 'Active' | 'Expired' | 'Terminated';
  }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.customer_id != null) where.customer_id = filters.customer_id;
    if (filters?.project_id != null) where.project_id = filters.project_id;
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

export const getContractsForDropdown = async (customer_id?: number) => {
  try {
    const where: any = {};
    if (customer_id != null) where.customer_id = customer_id;

    const contracts = await Contract.findAll({
      attributes: ['id', 'name', 'contract_number', 'status'],
      where,
      order: [
        ['name', 'ASC'],
        ['id', 'DESC'],
      ],
    });

    return { success: true, data: contracts };
  } catch (error) {
    console.error('getContractsForDropdown error:', error);
    return { success: false, message: 'Error fetching contracts for dropdown' };
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
    if (updates.project_id != null) {
      const project = await Project.findByPk(updates.project_id, { attributes: ['id'] });
      if (!project) return { success: false, message: 'Project not found', statusCode: 404 };
    }

    const nextCustomerId = updates.customer_id ?? (contract as any).customer_id;
    const nextProjectId = updates.project_id ?? (contract as any).project_id;
    if (nextProjectId != null) {
      const nextProject = await Project.findByPk(nextProjectId, { attributes: ['id', 'customer_id'] });
      if (!nextProject) return { success: false, message: 'Project not found', statusCode: 404 };
      if ((nextProject as any).customer_id !== nextCustomerId) {
        return { success: false, message: 'Project does not belong to the provided customer', statusCode: 400 };
      }
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

      if (payload.name !== undefined) payload.name = String(payload.name).trim();
      if (payload.description !== undefined) {
        const normalizedDescription = payload.description == null ? null : String(payload.description).trim();
        payload.description = normalizedDescription || null;
      }
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

export const exportContractsToExcel = async () => {
  try {
    const contracts = await Contract.findAll({
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'project_number', 'project_name'] },
      ],
      order: [['id', 'ASC']],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contracts');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Contract Number', key: 'contract_number', width: 18 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Customer', key: 'customer_name', width: 24 },
      { header: 'Project Number', key: 'project_number', width: 18 },
      { header: 'Project Name', key: 'project_name', width: 28 },
      { header: 'Type', key: 'contract_type', width: 16 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Start Date', key: 'start_date', width: 14 },
      { header: 'End Date', key: 'end_date', width: 14 },
      { header: 'Total Value', key: 'total_value', width: 16 },
      { header: 'Currency', key: 'currency', width: 12 },
      { header: 'Description', key: 'description', width: 36 },
      { header: 'Created At', key: 'created_at', width: 20 },
    ];

    contracts.forEach((contract: any) => {
      worksheet.addRow({
        id: contract.id,
        contract_number: contract.contract_number,
        name: contract.name,
        customer_name: contract.customer?.name ?? 'N/A',
        project_number: contract.project?.project_number ?? '',
        project_name: contract.project?.project_name ?? '',
        contract_type: contract.contract_type,
        status: contract.status,
        start_date: contract.start_date,
        end_date: contract.end_date,
        total_value: contract.total_value,
        currency: contract.currency,
        description: contract.description ?? '',
        created_at: contract.created_at,
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F5597' },
    };

    return { success: true, data: workbook };
  } catch (error) {
    console.error('exportContractsToExcel error:', error);
    return { success: false, message: 'Error exporting contracts', data: null };
  }
};
