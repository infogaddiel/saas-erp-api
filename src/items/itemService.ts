import { Item, User } from '../models';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';

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
export const bulkCreateItems = async (dataArray: CreateItemInput[]) => {
  try {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return { success: false, message: 'Invalid data: Expected non-empty array' };
    }

    const items = await Item.bulkCreate(
      dataArray.map((data) => ({
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
      })),
      { validate: true }
    );

    return {
      success: true,
      message: `${items.length} items created successfully`,
      data: { count: items.length, items },
    };
  } catch (error) {
    console.error('bulkCreateItems error:', error);
    return { success: false, message: 'Error creating items in bulk' };
  }
};

export const exportItemsToExcel = async () => {
  try {
    const items = await Item.findAll({
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }],
      order: [['id', 'ASC']],
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Items');

    // Set columns
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Item Code', key: 'item_code', width: 15 },
      { header: 'Item Name', key: 'item_name', width: 25 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Unit Price', key: 'unit_price', width: 12 },
      { header: 'GST %', key: 'gst_percentage', width: 10 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Stock Qty', key: 'stock_quantity', width: 12 },
      { header: 'Notes', key: 'notes', width: 25 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'created_at', width: 18 },
      { header: 'Updated At', key: 'updated_at', width: 18 },
    ];

    // Add data
    items.forEach((item: any) => {
      worksheet.addRow({
        id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        type: item.type,
        category: item.category,
        unit_price: item.unit_price,
        gst_percentage: item.gst_percentage,
        unit: item.unit,
        stock_quantity: item.stock_quantity,
        notes: item.notes,
        status: item.status ? 'Active' : 'Inactive',
        createdBy: item.createdBy?.name || 'N/A',
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    });

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };

    return {
      success: true,
      data: workbook,
    };
  } catch (error) {
    console.error('exportItemsToExcel error:', error);
    return { success: false, message: 'Error exporting items', data: null };
  }
};