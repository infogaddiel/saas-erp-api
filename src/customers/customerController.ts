import { Request, Response } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  bulkCreateCustomers,
  exportCustomersToExcel,
  getCustomersForDropdown,
  getCustomerTypes,
  createCustomerDetail,
  getCustomerDetails,
  getCustomerDetailById,
  updateCustomerDetail,
  deleteCustomerDetail,
} from './customerService';
import { Op } from 'sequelize';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string | number; company_id?: number | null; company_code?: string | null };
    }
  }
}

export const create = async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, address,pan_number,gst_number, ship_address, type, customer_type_id, status } = req.body;

    const result = await createCustomer({
      name,
      mobile,
      email,
      address,
      ship_address,
      pan_number,
      gst_number,
      type,
      customer_type_id,
      status,
      created_by: parseInt(req.user?.id as string),
    });

    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 500;
      return res.status(statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create customer controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const name = (req.query.name as string) || undefined;

    const result = await getCustomers(page, limit, name);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List customers controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getCustomerById(id);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Customer not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get customer controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    const result = await updateCustomer(id, updates);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? (result.message === 'Customer not found' ? 404 : 500);
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update customer controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteCustomer(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete customer controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const bulkCreate = async (req: Request, res: Response) => {
  try {
    const { customers } = req.body;
    const userId = parseInt(req.user?.id as string);

    if (!Array.isArray(customers)) {
      return res.status(400).json({ success: false, message: 'Expected "customers" array in body' });
    }

    const result = await bulkCreateCustomers(customers, userId);
    if (!result.success) {
      const statusCode = (result as any).statusCode ?? 400;
      return res.status(statusCode).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('Bulk create customers controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const exportExcel = async (req: Request, res: Response) => {
  try {
    const result = await exportCustomersToExcel();
    if (!result.success || !result.data) return res.status(500).json(result);

    const filename = `customers-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await result.data.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export customers controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const dropdown = async (req: Request, res: Response) => {
  try {
    const companyId = req.user?.company_id;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'User company not found' });
    }
    let whereCondition:any = {status:true};
    if(req.query.searchText){
     whereCondition = {...whereCondition,
                [Op.or]: [
                    {
                        name: {
                            [Op.iLike]: `%${req.query.searchText}%` // Case-insensitive search for name
                        }
                    },
                    {
                        mobile: {
                            [Op.iLike]: `%${req.query.searchText}%` // Case-insensitive search for mobile
                        }
                    }
                ]
            }
    }
    const result = await getCustomersForDropdown(companyId,whereCondition);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Dropdown customers controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const createDetail = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const result = await createCustomerDetail(customerId, req.body);
    if (!result.success) return res.status(result.message === 'Customer not found' ? 404 : 500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create customer detail controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const listCustomerTypes = async (_req: Request, res: Response) => {
  try {
    const result = await getCustomerTypes();
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List customer types controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const listDetails = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const result = await getCustomerDetails(customerId);
    if (!result.success) return res.status(result.message === 'Customer not found' ? 404 : 500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List customer details controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const getDetailById = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const detailId = parseInt(req.params.detailId, 10);
    const result = await getCustomerDetailById(customerId, detailId);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get customer detail controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const updateDetail = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const detailId = parseInt(req.params.detailId, 10);
    const result = await updateCustomerDetail(customerId, detailId, req.body);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update customer detail controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};

export const removeDetail = async (req: Request, res: Response) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const detailId = parseInt(req.params.detailId, 10);
    const result = await deleteCustomerDetail(customerId, detailId);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete customer detail controller error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
};
