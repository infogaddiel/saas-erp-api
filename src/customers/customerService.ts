import { Customer, User } from '../models';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';

interface CreateCustomerInput {
  name: string;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  type: 'Individual' | 'Company';
  status?: boolean;
  created_by?: number | null;
}

export const createCustomer = async (data: CreateCustomerInput) => {
  try {
    const customer = await Customer.create({
      name: data.name,
      mobile: data.mobile ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      type: data.type,
      status: data.status ?? true,
      created_by: data.created_by ?? null,
    });

    return { success: true, data: customer };
  } catch (error) {
    console.error('createCustomer error:', error);
    return { success: false, message: 'Error creating customer' };
  }
};

export const getCustomers = async (page = 1, limit = 20, name?: string) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (typeof name !== 'undefined' && name !== '') {
      where.name = { [Op.iLike]: `%${name}%` };
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        customers: rows,
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
    console.error('getCustomers error:', error);
    return { success: false, message: 'Error fetching customers' };
  }
};

export const getCustomerById = async (id: number) => {
  try {
    const customer = await Customer.findByPk(id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    if (!customer) return { success: false, message: 'Customer not found' };

    return { success: true, data: customer };
  } catch (error) {
    console.error('getCustomerById error:', error);
    return { success: false, message: 'Error fetching customer' };
  }
};

export const updateCustomer = async (id: number, updates: Partial<CreateCustomerInput>) => {
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return { success: false, message: 'Customer not found' };

    await customer.update(updates as any);
    return { success: true, data: customer };
  } catch (error) {
    console.error('updateCustomer error:', error);
    return { success: false, message: 'Error updating customer' };
  }
};

export const deleteCustomer = async (id: number) => {
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) return { success: false, message: 'Customer not found' };

    await customer.destroy();
    return { success: true, message: 'Customer deleted' };
  } catch (error) {
    console.error('deleteCustomer error:', error);
    return { success: false, message: 'Error deleting customer' };
  }
};
export const bulkCreateCustomers = async (dataArray: CreateCustomerInput[], userId: number) => {
  try {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, message: 'Invalid data: Expected non-empty array' };
    }

    const customers = await Customer.bulkCreate(
      dataArray.map((data) => ({
        name: data.name,
        mobile: data.mobile ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        type: data.type,
        created_by: userId,
      })),
      { validate: true }
    );

    return {
      success: true,
      message: `${customers.length} customers created successfully`,
      data: { count: customers.length, customers },
    };
  } catch (error) {
    console.error('bulkCreateCustomers error:', error);
    return { success: false, message: 'Error creating customers in bulk' };
  }
};

export const exportCustomersToExcel = async () => {
  try {
    const customers = await Customer.findAll({
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
      order: [['id', 'ASC']],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    // Set columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'created_at', width: 18 },
      { header: 'Updated At', key: 'updated_at', width: 18 },
    ];

    // Add data
    customers.forEach((customer: any) => {
      worksheet.addRow({
        id: customer.id,
        name: customer.name,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
        type: customer.type,
        status: customer.status ? 'Active' : 'Inactive',
        createdBy: customer.createdBy?.name || 'N/A',
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    return {
      success: true,
      data: workbook,
    };
  } catch (error) {
    console.error('exportCustomersToExcel error:', error);
    return { success: false, message: 'Error exporting customers', data: null };
  }
};