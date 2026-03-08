import sequelize from '../config/database';
import { Op, Transaction } from 'sequelize';
import ExcelJS from 'exceljs';
import {
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
  contract_type: 'AMC-Daikin' | 'AMC-Semak' | 'Service' | 'Subscription';
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

const DEFAULT_CONTRACT_PREFIX = 'GED';
const CONTRACT_NUMBER_MIDDLE = 'CONT';

const contractInclude = [
  { model: Customer, as: 'customer', attributes: ['id', 'name', 'mobile', 'email'] },
  { model: Project, as: 'project', attributes: ['id', 'project_number', 'project_name', 'status', 'customer_id'] },
  {
    model: ContractItem.unscoped(),
    as: 'lineItems',
    required: false,
    include: [
      { model: Item, as: 'item', attributes: ['id', 'item_name', 'item_code'] },
      {
        model: ServiceSchedule,
        as: 'serviceSchedules',
        required: false,
        include: [{ model: User, as: 'technician', attributes: ['id', 'name', 'email'] }],
      },
    ],
  },
  { model: ContractInvoice, as: 'invoices', required: false },
];

const calculateTotalValue = (lineItems: CreateContractItemInput[]): number => {
  return lineItems.reduce((sum, item) => sum + (item.quantity ?? 1) * item.unit_price, 0);
};

const getCompanyPrefix = (companyCode: string | null | undefined): string => {
  if (!companyCode) return DEFAULT_CONTRACT_PREFIX;
  const normalized = companyCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length !== 3) return DEFAULT_CONTRACT_PREFIX;
  return normalized;
};

const generateNextContractNumber = async (
  companyCode: string | null | undefined,
  customerId: number
): Promise<string> => {
  const prefix = getCompanyPrefix(companyCode);
  const customerToken = String(customerId);
  const numberPrefix = `${prefix}${CONTRACT_NUMBER_MIDDLE}${customerToken}`;

  const contractCount = await Contract.unscoped().count({
    where: {
      customer_id: customerId,
      contract_number: {
        [Op.iLike]: `${numberPrefix}%`,
      },
    },
  });

  return `${numberPrefix}${contractCount + 1}`;
};

const createLineItemsAndSchedules = async (
  contractId: number,
  lineItems: CreateContractItemInput[],
  transaction?: Transaction
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
          contract_item_id: createdLineItem.id,
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
  transaction?: Transaction
) => {
  if (invoices.length === 0) return;
  await ContractInvoice.bulkCreate(
    invoices.map((invoice) => ({
      contract_id: contractId,
      scheduled_billing_date: invoice.scheduled_billing_date,
      amount_to_bill: invoice.amount_to_bill,
      invoice_reference: invoice.invoice_reference ?? null,
      billing_status: invoice.billing_status ?? 'Pending',
    })),
    { transaction }
  );
};

const getContractByIdWithFallback = async (id: number) => {
  try {
    return await Contract.unscoped().findByPk(id, { include: contractInclude });
  } catch (includeError) {
    console.error('Contract include fetch failed, returning base contract:', includeError);
    return Contract.unscoped().findByPk(id);
  }
};

const getContractsWithFallback = async (where: any, offset: number, limit: number) => {
  const count = await Contract.unscoped().count({ where });
  try {
    const rows = await Contract.unscoped().findAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: contractInclude,
    });
    return { count, rows };
  } catch (includeError) {
    console.error('Contract list include fetch failed, returning base contracts:', includeError);
    const rows = await Contract.unscoped().findAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
    });
    return { count, rows };
  }
};

export const createContract = async (data: CreateContractInput, companyCode?: string | null) => {
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

    const contractNumber = await generateNextContractNumber(companyCode, data.customer_id);
    const created = await Contract.create({
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
    });

    await createLineItemsAndSchedules(created.id, lineItems);
    await createInvoices(created.id, invoices);

    const withAssociations = await getContractByIdWithFallback(created.id);
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
    contract_type?: 'AMC-Daikin' | 'AMC-Semak' | 'Service' | 'Subscription';
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

    const { count, rows } = await getContractsWithFallback(where, offset, limit);

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
    const contract = await getContractByIdWithFallback(id);
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

    const contracts = await Contract.unscoped().findAll({
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
    const contract = await Contract.unscoped().findByPk(id);
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
      const existingContract = await Contract.unscoped().findOne({
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
        await ContractItem.update(
          { deleted_at: new Date() } as any,
          { where: { contract_id: id, deleted_at: null }, transaction }
        );
        await createLineItemsAndSchedules(id, updates.line_items, transaction);
      }

      if (updates.invoices) {
        await ContractInvoice.update(
          { deleted_at: new Date() } as any,
          { where: { contract_id: id, deleted_at: null }, transaction }
        );
        await createInvoices(id, updates.invoices, transaction);
      }
    });

    const withAssociations = await getContractByIdWithFallback(id);
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
      await ContractItem.update(
        { deleted_at: new Date() } as any,
        { where: { contract_id: id, deleted_at: null }, transaction }
      );
      await ContractInvoice.update(
        { deleted_at: new Date() } as any,
        { where: { contract_id: id, deleted_at: null }, transaction }
      );
      await contract.update({ deleted_at: new Date() } as any, { transaction });
    });

    return { success: true, message: 'Contract deleted' };
  } catch (error) {
    console.error('deleteContract error:', error);
    return { success: false, message: 'Error deleting contract' };
  }
};

export const exportContractsToExcel = async () => {
  try {
    const contracts = await Contract.unscoped().findAll({
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
