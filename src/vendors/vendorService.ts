import { Op } from 'sequelize';
import { User, Vendor } from '../models';
import ExcelJS from 'exceljs';

interface CreateVendorInput {
  vendor_name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  category?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: boolean;
  created_by?: number | null;
}

export const createVendor = async (data: CreateVendorInput) => {
  try {
    const vendor = await Vendor.create({
      vendor_name: data.vendor_name,
      company: data.company ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      category: data.category ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      status: data.status ?? true,
      created_by: data.created_by ?? null,
    });

    return { success: true, data: vendor };
  } catch (error) {
    console.error('createVendor error:', error);
    return { success: false, message: 'Error creating vendor' };
  }
};

export const getVendors = async (
  page = 1,
  limit = 20,
  search?: string,
  category?: string,
  status?: boolean
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (typeof search !== 'undefined' && search.trim() !== '') {
      where[Op.or] = [
        { vendor_name: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (typeof category !== 'undefined' && category.trim() !== '') {
      where.category = { [Op.iLike]: `%${category}%` };
    }

    if (typeof status !== 'undefined') {
      where.status = status;
    }

    const { count, rows } = await Vendor.findAndCountAll({
      where,
      distinct: true,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        vendors: rows,
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
    console.error('getVendors error:', error);
    return { success: false, message: 'Error fetching vendors' };
  }
};

export const getVendorById = async (id: number) => {
  try {
    const vendor = await Vendor.findByPk(id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    if (!vendor) return { success: false, message: 'Vendor not found' };

    return { success: true, data: vendor };
  } catch (error) {
    console.error('getVendorById error:', error);
    return { success: false, message: 'Error fetching vendor' };
  }
};

export const getVendorsForDropdown = async (filters?: { searchText?: string; status?: boolean }) => {
  try {
    const where: any = {};

    if (filters?.status != null) {
      where.status = filters.status;
    }

    const searchText = filters?.searchText?.trim();
    if (searchText) {
      where[Op.or] = [
        { vendor_name: { [Op.iLike]: `%${searchText}%` } },
        { company: { [Op.iLike]: `%${searchText}%` } },
        { email: { [Op.iLike]: `%${searchText}%` } },
        { phone: { [Op.iLike]: `%${searchText}%` } },
      ];
    }

    const rows = await Vendor.findAll({
      attributes: ['id', 'vendor_name', 'company', 'email', 'phone'],
      where,
      order: [['vendor_name', 'ASC']],
    });

    return { success: true, data: rows };
  } catch (error) {
    console.error('getVendorsForDropdown error:', error);
    return { success: false, message: 'Error fetching vendors for dropdown' };
  }
};

export const bulkCreateVendors = async (dataArray: CreateVendorInput[], userId: number | null) => {
  try {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, message: 'Invalid data: Expected non-empty array' };
    }

    const errors: Array<{ index: number; field: string; message: string }> = [];
    const seenNames = new Set<string>();

    const normalizedRows = dataArray.map((data, index) => {
      const vendorName = String(data.vendor_name ?? '').trim();
      const email = typeof data.email === 'string' ? data.email.trim() : data.email ?? null;
      const phone = typeof data.phone === 'string' ? data.phone.trim() : data.phone ?? null;

      if (!vendorName) errors.push({ index, field: 'vendor_name', message: 'vendor_name is required' });

      if (vendorName) {
        const key = vendorName.toLowerCase();
        if (seenNames.has(key)) {
          errors.push({ index, field: 'vendor_name', message: 'Duplicate vendor_name in request payload' });
        } else {
          seenNames.add(key);
        }
      }

      return {
        vendor_name: vendorName,
        company: data.company ?? null,
        email: email === '' ? null : email,
        phone: phone === '' ? null : phone,
        category: data.category ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
        status: data.status ?? true,
        created_by: data.created_by ?? userId ?? null,
      };
    });

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Bulk validation failed',
        statusCode: 400,
        data: { errors },
      };
    }

    const vendors = await Vendor.bulkCreate(normalizedRows as any[], { validate: true });

    return {
      success: true,
      message: `${vendors.length} vendors created successfully`,
      data: { count: vendors.length, vendors },
    };
  } catch (error) {
    console.error('bulkCreateVendors error:', error);
    return { success: false, message: 'Error creating vendors in bulk' };
  }
};

export const exportVendorsToExcel = async () => {
  try {
    const vendors = await Vendor.findAll({
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
      order: [['id', 'ASC']],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vendors');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Vendor Name', key: 'vendor_name', width: 28 },
      { header: 'Company', key: 'company', width: 24 },
      { header: 'Email', key: 'email', width: 26 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Address', key: 'address', width: 36 },
      { header: 'Notes', key: 'notes', width: 36 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'created_at', width: 18 },
      { header: 'Updated At', key: 'updated_at', width: 18 },
    ];

    vendors.forEach((vendor: any) => {
      worksheet.addRow({
        id: vendor.id,
        vendor_name: vendor.vendor_name,
        company: vendor.company ?? '',
        email: vendor.email ?? '',
        phone: vendor.phone ?? '',
        category: vendor.category ?? '',
        address: vendor.address ?? '',
        notes: vendor.notes ?? '',
        status: vendor.status ? 'Active' : 'Inactive',
        createdBy: vendor.createdBy?.name || 'N/A',
        created_at: vendor.created_at,
        updated_at: vendor.updated_at,
      });
    });

    worksheet.getRow(1).font = { bold: true };

    return { success: true, data: workbook };
  } catch (error) {
    console.error('exportVendorsToExcel error:', error);
    return { success: false, message: 'Error exporting vendors', data: null };
  }
};

export const updateVendor = async (id: number, updates: Partial<CreateVendorInput>) => {
  try {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) return { success: false, message: 'Vendor not found' };

    await vendor.update(updates as any);
    return { success: true, data: vendor };
  } catch (error) {
    console.error('updateVendor error:', error);
    return { success: false, message: 'Error updating vendor' };
  }
};

export const deleteVendor = async (id: number) => {
  try {
    const vendor = await Vendor.findByPk(id);
    if (!vendor) return { success: false, message: 'Vendor not found' };

    await vendor.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'Vendor deleted' };
  } catch (error) {
    console.error('deleteVendor error:', error);
    return { success: false, message: 'Error deleting vendor' };
  }
};
