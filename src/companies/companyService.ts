import { Company } from '../models';
import { Op } from 'sequelize';

interface CompanyPayload {
  name: string;
  address?: string | null;
  contract?: string | null;
  logo?: string | null;
  email?: string | null;
  mobile?: string | null;
  status?: boolean;
  license_number?: string | null;
  license_expiry_date?: Date | null;
  license_image?: string | null;
  license_type?: string | null;
  license_status?: string | null;
  license_renewal_date?: Date | null;
  license_renewal_amount?: number | null;
  license_renewal_status?: string | null;
  gst_number?: string | null;
  gst_certificate?: string | null;
  gst_certificate_expiry_date?: Date | null;
  gst_certificate_status?: string | null;
  gst_certificate_renewal_date?: Date | null;
  gst_certificate_renewal_amount?: number | null;
  gst_certificate_renewal_status?: string | null;
  pan_number?: string | null;
  pan_certificate?: string | null;
  pan_certificate_expiry_date?: Date | null;
  pan_certificate_status?: string | null;
  pan_certificate_renewal_date?: Date | null;
  pan_certificate_renewal_amount?: number | null;
  pan_certificate_renewal_status?: string | null;
}

export const createCompany = async (data: CompanyPayload) => {
  try {
    const company = await Company.create({
      name: data.name,
      address: data.address ?? null,
      contract: data.contract ?? null,
      logo: data.logo ?? null,
      email: data.email ?? null,
      mobile: data.mobile ?? null,
      status: data.status ?? true,
      license_number: data.license_number ?? null,
      license_expiry_date: data.license_expiry_date ?? null,
      license_image: data.license_image ?? null,
      license_type: data.license_type ?? null,
      license_status: data.license_status ?? null,
      license_renewal_date: data.license_renewal_date ?? null,
      license_renewal_amount: data.license_renewal_amount ?? null,
      license_renewal_status: data.license_renewal_status ?? null,
      gst_number: data.gst_number ?? null,
      gst_certificate: data.gst_certificate ?? null,
      gst_certificate_expiry_date: data.gst_certificate_expiry_date ?? null,
      gst_certificate_status: data.gst_certificate_status ?? null,
      gst_certificate_renewal_date: data.gst_certificate_renewal_date ?? null,
      gst_certificate_renewal_amount: data.gst_certificate_renewal_amount ?? null,
      gst_certificate_renewal_status: data.gst_certificate_renewal_status ?? null,
      pan_number: data.pan_number ?? null,
      pan_certificate: data.pan_certificate ?? null,
      pan_certificate_expiry_date: data.pan_certificate_expiry_date ?? null,
      pan_certificate_status: data.pan_certificate_status ?? null,
      pan_certificate_renewal_date: data.pan_certificate_renewal_date ?? null,
      pan_certificate_renewal_amount: data.pan_certificate_renewal_amount ?? null,
      pan_certificate_renewal_status: data.pan_certificate_renewal_status ?? null,
    });

    return { success: true, data: company };
  } catch (error) {
    console.error('createCompany error:', error);
    return { success: false, message: 'Error creating company' };
  }
};

export const getCompanies = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const { count, rows } = await Company.findAndCountAll({
      offset,
      limit,
      order: [['id', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    return {
      success: true,
      data: {
        companies: rows,
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
    console.error('getCompanies error:', error);
    return { success: false, message: 'Error fetching companies' };
  }
};

export const getCompanyById = async (id: number) => {
  try {
    const company = await Company.findByPk(id);
    if (!company) return { success: false, message: 'Company not found' };

    return { success: true, data: company };
  } catch (error) {
    console.error('getCompanyById error:', error);
    return { success: false, message: 'Error fetching company' };
  }
};

export const updateCompany = async (id: number, updates: Partial<CompanyPayload>) => {
  try {
    const company = await Company.findByPk(id);
    if (!company) return { success: false, message: 'Company not found' };

    await company.update(updates as any);
    return { success: true, data: company };
  } catch (error) {
    console.error('updateCompany error:', error);
    return { success: false, message: 'Error updating company' };
  }
};

export const deleteCompany = async (id: number) => {
  try {
    const company = await Company.findByPk(id);
    if (!company) return { success: false, message: 'Company not found' };

    await company.destroy();
    return { success: true, message: 'Company deleted' };
  } catch (error) {
    console.error('deleteCompany error:', error);
    return { success: false, message: 'Error deleting company' };
  }
};

export const getCompaniesForDropdown = async (searchText?: string) => {
  try {
    const where: any = {};

    if (searchText && searchText.trim() !== '') {
      where.name = { [Op.iLike]: `%${searchText.trim()}%` };
    }

    const rows = await Company.findAll({
      attributes: ['id', 'name'],
      where,
      order: [['name', 'ASC']],
    });

    return {
      success: true,
      data: rows,
    };
  } catch (error) {
    console.error('getCompaniesForDropdown error:', error);
    return { success: false, message: 'Error fetching companies for dropdown' };
  }
};
