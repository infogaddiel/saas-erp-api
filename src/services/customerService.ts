import { Customer, User } from '../models';

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

export const getCustomers = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const { count, rows } = await Customer.findAndCountAll({
      offset,
      limit,
      order: [['id', 'DESC']],
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    return { success: true, data: { total: count, customers: rows } };
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
