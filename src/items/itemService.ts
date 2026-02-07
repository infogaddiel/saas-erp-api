import { Item, User } from '../models';
import { Op } from 'sequelize';

interface CreateItemInput {
  item_code: string;
  item_name: string;
  description?: string | null;
  type: string;
  category: string;
  unit_price: number;
  gst_percentage?: number;
  unit: string;
  stock_quantity?: number;
  notes?: string | null;
  status?: boolean;
  created_by?: number | null;
}

export const createItem = async (data: CreateItemInput) => {
  try {
    const item = await Item.create({
      item_code: data.item_code,
      item_name: data.item_name,
      description: data.description ?? null,
      type: data.type,
      category: data.category,
      unit_price: data.unit_price,
      gst_percentage: data.gst_percentage ?? 18.0,
      unit: data.unit,
      stock_quantity: data.stock_quantity ?? 0,
      notes: data.notes ?? null,
      status: data.status ?? true,
      created_by: data.created_by ?? null,
    });

    return { success: true, data: item };
  } catch (error) {
    console.error('createItem error:', error);
    return { success: false, message: 'Error creating item' };
  }
};

export const getItems = async (page = 1, limit = 20, name?: string) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};
    if (typeof name !== 'undefined' && name !== '') {
      where[Op.or] = [
        { item_name: { [Op.iLike]: `%${name}%` } },
        { item_code: { [Op.iLike]: `%${name}%` } },
      ];
    }

    const { count, rows } = await Item.findAndCountAll({
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
        items: rows,
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
    console.error('getItems error:', error);
    return { success: false, message: 'Error fetching items' };
  }
};

export const getItemById = async (id: number) => {
  try {
    const item = await Item.findByPk(id, {
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
    });

    if (!item) return { success: false, message: 'Item not found' };

    return { success: true, data: item };
  } catch (error) {
    console.error('getItemById error:', error);
    return { success: false, message: 'Error fetching item' };
  }
};

export const updateItem = async (id: number, updates: Partial<CreateItemInput>) => {
  try {
    const item = await Item.findByPk(id);
    if (!item) return { success: false, message: 'Item not found' };

    await item.update(updates as any);
    return { success: true, data: item };
  } catch (error) {
    console.error('updateItem error:', error);
    return { success: false, message: 'Error updating item' };
  }
};

export const deleteItem = async (id: number) => {
  try {
    const item = await Item.findByPk(id);
    if (!item) return { success: false, message: 'Item not found' };

    await item.destroy();
    return { success: true, message: 'Item deleted' };
  } catch (error) {
    console.error('deleteItem error:', error);
    return { success: false, message: 'Error deleting item' };
  }
};
