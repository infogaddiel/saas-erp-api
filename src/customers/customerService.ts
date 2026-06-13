import { Customer, CustomerDetail, CustomerType, User } from '../models';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';

interface CreateCustomerInput {
  name: string;
  mobile?: string | null;
  email?: string | null;
  gst_number?: string | null;
  pan_number?: string | null;
  address?: string | null;
  ship_address?: string | null;
  type: 'Individual' | 'Company';
  customer_type_id?: number | null;
  customer_type?: string | null;
  status?: boolean;
  created_by?: number | null;
}

interface CustomerDetailInput {
  name: string;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  is_primary?: boolean;
}

export const createCustomer = async (data: CreateCustomerInput) => {
  try {
    const mobile = data.mobile?.trim() ?? null;
    const email = data.email?.trim() ?? null;

    if (mobile) {
      const existingMobile = await Customer.findOne({
        where: { mobile },
        attributes: ['id'],
      });

      if (existingMobile) {
        return { success: false, message: 'Mobile already exists', statusCode: 409 };
      }
    }

    if (email) {
      const existingEmail = await Customer.findOne({
        where: { email: { [Op.iLike]: email } },
        attributes: ['id'],
      });

      if (existingEmail) {
        return { success: false, message: 'Email already exists', statusCode: 409 };
      }
    }

    const customer = await Customer.create({
      name: data.name,
      mobile,
      email,
      gst_number: data.gst_number ?? null,
      pan_number: data.pan_number ?? null,
      address: data.address ?? null,
      ship_address: data.ship_address ?? null,
      type: data.type,
      customer_type_id: data.customer_type_id ?? null,
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
      distinct: true,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [
        { model: CustomerType, as: 'customerType', attributes: ['id', 'name'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: CustomerDetail, as: 'customerDetails', required: false, attributes: ['id', 'name', 'mobile', 'email', 'address', 'is_primary'] },
      ],
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
      include: [
        { model: CustomerType, as: 'customerType', attributes: ['id', 'name'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: CustomerDetail, as: 'customerDetails', attributes: ['id', 'name', 'mobile', 'email', 'address', 'is_primary'] },
      ],
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

    const mobile = updates.mobile?.trim();
    const email = updates.email?.trim();

    if (mobile) {
      const existingMobile = await Customer.findOne({
        where: {
          mobile,
          id: { [Op.ne]: id },
        },
        attributes: ['id'],
      });

      if (existingMobile) {
        return { success: false, message: 'Mobile already exists', statusCode: 409 };
      }
    }

    if (email) {
      const existingEmail = await Customer.findOne({
        where: {
          email: { [Op.iLike]: email },
          id: { [Op.ne]: id },
        },
        attributes: ['id'],
      });

      if (existingEmail) {
        return { success: false, message: 'Email already exists', statusCode: 409 };
      }
    }

    const normalizedUpdates = {
      ...updates,
      ...(typeof updates.mobile !== 'undefined' ? { mobile: updates.mobile?.trim() ?? null } : {}),
      ...(typeof updates.email !== 'undefined' ? { email: updates.email?.trim() ?? null } : {}),
    };

    await customer.update(normalizedUpdates as any);
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

    await customer.update({ deleted_at: new Date() } as any);
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

    const customerTypes = await CustomerType.findAll({ attributes: ['id', 'name'] });
    const customerTypeByName = new Map<string, number>();
    const customerTypeIds = new Set<number>();
    customerTypes.forEach((ct: any) => {
      customerTypeByName.set(String(ct.name).trim().toLowerCase(), ct.id);
      customerTypeIds.add(Number(ct.id));
    });

    const errors: Array<{ index: number; field: string; message: string }> = [];
    const seenMobiles = new Set<string>();
    const seenEmails = new Set<string>();

    const normalizedRows = dataArray.map((data, index) => {
      const mobile = data.mobile?.trim() ?? null;
      const email = data.email?.trim() ?? null;
      const type = data.type ?? 'Company';

      if (!data.name || !String(data.name).trim()) {
        errors.push({ index, field: 'name', message: 'name is required' });
      }
      if (!mobile) {
        errors.push({ index, field: 'mobile', message: 'mobile is required' });
      }
      if (type !== 'Individual' && type !== 'Company') {
        errors.push({ index, field: 'type', message: 'type must be Individual or Company' });
      }

      if (mobile) {
        if (seenMobiles.has(mobile)) {
          errors.push({ index, field: 'mobile', message: 'Duplicate mobile in request payload' });
        } else {
          seenMobiles.add(mobile);
        }
      }

      if (email) {
        const lowerEmail = email.toLowerCase();
        if (seenEmails.has(lowerEmail)) {
          errors.push({ index, field: 'email', message: 'Duplicate email in request payload' });
        } else {
          seenEmails.add(lowerEmail);
        }
      }

      let resolvedCustomerTypeId: number | null = null;
      if (data.customer_type_id != null) {
        const typeId = Number(data.customer_type_id);
        if (!customerTypeIds.has(typeId)) {
          errors.push({ index, field: 'customer_type_id', message: `customer_type_id "${data.customer_type_id}" not found` });
        } else {
          resolvedCustomerTypeId = typeId;
        }
      } else if (data.customer_type) {
        const mappedId = customerTypeByName.get(String(data.customer_type).trim().toLowerCase());
        if (!mappedId) {
          errors.push({ index, field: 'customer_type', message: `customer_type "${data.customer_type}" not found` });
        } else {
          resolvedCustomerTypeId = mappedId;
        }
      }

      return {
        name: String(data.name ?? '').trim(),
        mobile,
        email,
        address: data.address ?? null,
        ship_address: data.ship_address ?? null,
        gst_number: data.gst_number ?? null,
        pan_number: data.pan_number ?? null,
        type,
        customer_type_id: resolvedCustomerTypeId,
      };
    });

    const mobileList = normalizedRows.map((row) => row.mobile).filter((value): value is string => Boolean(value));
    if (mobileList.length > 0) {
      const existingMobiles = await Customer.findAll({
        where: { mobile: { [Op.in]: mobileList } },
        attributes: ['mobile'],
      });
      const existingMobileSet = new Set((existingMobiles as any[]).map((row) => String(row.mobile)));
      normalizedRows.forEach((row, index) => {
        if (row.mobile && existingMobileSet.has(row.mobile)) {
          errors.push({ index, field: 'mobile', message: `mobile "${row.mobile}" already exists` });
        }
      });
    }

    const emailList = normalizedRows.map((row) => row.email).filter((value): value is string => Boolean(value));
    if (emailList.length > 0) {
      const existingEmails = await Customer.findAll({
        where: { email: { [Op.in]: emailList } },
        attributes: ['email'],
      });
      const existingEmailSet = new Set((existingEmails as any[]).map((row) => String(row.email).toLowerCase()));
      normalizedRows.forEach((row, index) => {
        if (row.email && existingEmailSet.has(row.email.toLowerCase())) {
          errors.push({ index, field: 'email', message: `email "${row.email}" already exists` });
        }
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Bulk validation failed',
        statusCode: 400,
        data: { errors },
      };
    }

    const customers = await Customer.bulkCreate(
      normalizedRows.map((row) => ({
        ...row,
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
      include: [
        { model: CustomerType, as: 'customerType', attributes: ['id', 'name'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
      ],
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
      { header: 'GST Number', key: 'gst_number', width: 25 },
      { header: 'PAN Number', key: 'pan_number', width: 25 },
      { header: 'Address', key: 'address', width: 30 },
      { header: 'Shipping Address', key: 'ship_address', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Customer Type', key: 'customerType', width: 20 },
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
        gst_number: customer.gst_number,
        pan_number: customer.pan_number,
        address: customer.address,
        ship_address: customer.ship_address,
        type: customer.type,
        customerType: customer.customerType?.name || 'N/A',
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

export const getCustomersForDropdown = async (companyId: number, whereCondition: any = {}) => {
  try {
    const customers = await Customer.findAll({
      attributes: ['id', 'name', 'mobile', 'email', 'address', 'ship_address', 'customer_type_id'],
      where: whereCondition,
      include: [
        {
          model: CustomerType,
          as: 'customerType',
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: User,
          as: 'createdBy',
          attributes: [],
          where: { company_id: companyId },
          required: true,
        },
      ],
      order: [['name', 'ASC']],
    });

    return { success: true, data: customers };
  } catch (error) {
    console.error('getCustomersForDropdown error:', error);
    return { success: false, message: 'Error fetching customers for dropdown' };
  }
};

export const createCustomerDetail = async (customerId: number, data: CustomerDetailInput) => {
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) return { success: false, message: 'Customer not found' };

    if (data.is_primary) {
      await CustomerDetail.update({ is_primary: false } as any, { where: { customer_id: customerId } });
    }

    const detail = await CustomerDetail.create({
      customer_id: customerId,
      name: data.name,
      mobile: data.mobile ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      is_primary: data.is_primary ?? false,
    });

    return { success: true, data: detail };
  } catch (error) {
    console.error('createCustomerDetail error:', error);
    return { success: false, message: 'Error creating customer detail' };
  }
};

export const getCustomerTypes = async () => {
  try {
    const customerTypes = await CustomerType.findAll({
      attributes: ['id', 'name'],
      order: [['id', 'ASC']],
    });

    return { success: true, data: customerTypes };
  } catch (error) {
    console.error('getCustomerTypes error:', error);
    return { success: false, message: 'Error fetching customer types' };
  }
};

export const getCustomerDetails = async (customerId: number) => {
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) return { success: false, message: 'Customer not found' };

    const details = await CustomerDetail.findAll({
      where: { customer_id: customerId },
      order: [
        ['is_primary', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    return { success: true, data: details };
  } catch (error) {
    console.error('getCustomerDetails error:', error);
    return { success: false, message: 'Error fetching customer details' };
  }
};

export const getCustomerDetailById = async (customerId: number, detailId: number) => {
  try {
    const detail = await CustomerDetail.findOne({
      where: { id: detailId, customer_id: customerId },
    });

    if (!detail) return { success: false, message: 'Customer detail not found' };

    return { success: true, data: detail };
  } catch (error) {
    console.error('getCustomerDetailById error:', error);
    return { success: false, message: 'Error fetching customer detail' };
  }
};

export const updateCustomerDetail = async (customerId: number, detailId: number, updates: Partial<CustomerDetailInput>) => {
  try {
    const detail = await CustomerDetail.findOne({
      where: { id: detailId, customer_id: customerId },
    });
    if (!detail) return { success: false, message: 'Customer detail not found' };

    if (updates.is_primary) {
      await CustomerDetail.update({ is_primary: false } as any, { where: { customer_id: customerId } });
    }

    await detail.update(updates as any);
    return { success: true, data: detail };
  } catch (error) {
    console.error('updateCustomerDetail error:', error);
    return { success: false, message: 'Error updating customer detail' };
  }
};

export const deleteCustomerDetail = async (customerId: number, detailId: number) => {
  try {
    const detail = await CustomerDetail.findOne({
      where: { id: detailId, customer_id: customerId },
    });
    if (!detail) return { success: false, message: 'Customer detail not found' };

    await detail.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'Customer detail deleted' };
  } catch (error) {
    console.error('deleteCustomerDetail error:', error);
    return { success: false, message: 'Error deleting customer detail' };
  }
};
