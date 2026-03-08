import { Op } from 'sequelize';
import { User, Vendor } from '../models';

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
