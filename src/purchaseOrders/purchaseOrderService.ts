import { Op, UniqueConstraintError } from 'sequelize';
import sequelize from '../config/database';
import { PurchaseOrder, User, Vendor } from '../models';
import type { PurchaseOrderStatus } from '../models/PurchaseOrder';

interface CreatePurchaseOrderInput {
  po_number?: string | null;
  vendor_id: number;
  order_date: string;
  expected_delivery?: string | null;
  total_amount: number;
  status?: PurchaseOrderStatus;
  items_description?: string | null;
  notes?: string | null;
  created_by?: number | null;
}

interface UpdatePurchaseOrderInput extends Partial<CreatePurchaseOrderInput> {}

const PO_NUMBER_PREFIX = 'PO';
const PO_NUMBER_PADDING = 5;
const MAX_PO_NUMBER_RETRIES = 3;

const parseDate = (value: string | null | undefined): string | null => {
  if (value == null || value === '') return null;
  const match = String(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${y}-${m}-${d}`;
};

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const generateNextPoNumber = async (transaction?: any): Promise<string> => {
  const latest = await PurchaseOrder.findOne({
    where: {
      po_number: {
        [Op.like]: `${PO_NUMBER_PREFIX}%`,
      },
    },
    attributes: ['po_number'],
    order: [['id', 'DESC']],
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  let nextSequence = 1;
  const currentNumber = latest?.po_number;
  if (currentNumber) {
    const match = currentNumber.match(new RegExp(`^${PO_NUMBER_PREFIX}(\\d+)$`));
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!Number.isNaN(parsed)) nextSequence = parsed + 1;
    }
  }

  return `${PO_NUMBER_PREFIX}${String(nextSequence).padStart(PO_NUMBER_PADDING, '0')}`;
};

const purchaseOrderInclude = [
  { model: Vendor, as: 'vendor', attributes: ['id', 'vendor_name', 'company', 'email', 'phone'] },
  { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
];

export const createPurchaseOrder = async (data: CreatePurchaseOrderInput) => {
  try {
    const vendor = await Vendor.findByPk(data.vendor_id, { attributes: ['id'] });
    if (!vendor) return { success: false, message: 'Vendor not found', statusCode: 404 };

    const orderDate = parseDate(data.order_date);
    const expectedDelivery = parseDate(data.expected_delivery);
    if (!orderDate) {
      return { success: false, message: 'order_date must be a valid date in dd-mm-yyyy format', statusCode: 400 };
    }

    if (expectedDelivery && new Date(expectedDelivery) < new Date(orderDate)) {
      return {
        success: false,
        message: 'expected_delivery must be greater than or equal to order_date',
        statusCode: 400,
      };
    }

    let created: any = null;
    for (let attempt = 0; attempt < MAX_PO_NUMBER_RETRIES; attempt += 1) {
      try {
        created = await sequelize.transaction(async (transaction) => {
          const poNumber = normalizeOptionalText(data.po_number) ?? (await generateNextPoNumber(transaction));

          return PurchaseOrder.create(
            {
              po_number: poNumber,
              vendor_id: data.vendor_id,
              order_date: orderDate,
              expected_delivery: expectedDelivery,
              total_amount: data.total_amount,
              status: data.status ?? 'Draft',
              items_description: normalizeOptionalText(data.items_description),
              notes: normalizeOptionalText(data.notes),
              created_by: data.created_by ?? null,
            },
            { transaction }
          );
        });

        break;
      } catch (error) {
        const isUniqueViolation = error instanceof UniqueConstraintError;
        if (!isUniqueViolation || attempt === MAX_PO_NUMBER_RETRIES - 1) throw error;
      }
    }

    if (!created) return { success: false, message: 'Error creating purchase order' };

    const withAssociations = await PurchaseOrder.findByPk(created.id, { include: purchaseOrderInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createPurchaseOrder error:', error);
    return { success: false, message: 'Error creating purchase order' };
  }
};

export const getPurchaseOrders = async (
  page = 1,
  limit = 20,
  filters?: { vendor_id?: number; status?: PurchaseOrderStatus; po_number?: string }
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.vendor_id != null) where.vendor_id = filters.vendor_id;
    if (filters?.status) where.status = filters.status;
    if (filters?.po_number && filters.po_number.trim() !== '') {
      where.po_number = { [Op.iLike]: `%${filters.po_number.trim()}%` };
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      distinct: true,
      offset,
      limit,
      order: [['id', 'DESC']],
      include: purchaseOrderInclude,
    });

    const totalPages = Math.ceil(count / limit);
    return {
      success: true,
      data: {
        purchase_orders: rows,
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
    console.error('getPurchaseOrders error:', error);
    return { success: false, message: 'Error fetching purchase orders' };
  }
};

export const getPurchaseOrderById = async (id: number) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(id, { include: purchaseOrderInclude });
    if (!purchaseOrder) return { success: false, message: 'Purchase order not found' };
    return { success: true, data: purchaseOrder };
  } catch (error) {
    console.error('getPurchaseOrderById error:', error);
    return { success: false, message: 'Error fetching purchase order' };
  }
};

export const updatePurchaseOrder = async (id: number, updates: UpdatePurchaseOrderInput) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) return { success: false, message: 'Purchase order not found' };

    if (updates.vendor_id != null) {
      const vendor = await Vendor.findByPk(updates.vendor_id, { attributes: ['id'] });
      if (!vendor) return { success: false, message: 'Vendor not found', statusCode: 404 };
    }

    const nextOrderDate = updates.order_date ? parseDate(updates.order_date) : String(purchaseOrder.order_date);
    const nextExpectedDelivery =
      updates.expected_delivery === undefined
        ? purchaseOrder.expected_delivery
          ? String(purchaseOrder.expected_delivery)
          : null
        : parseDate(updates.expected_delivery);

    if (updates.order_date && !nextOrderDate) {
      return { success: false, message: 'order_date must be a valid date in dd-mm-yyyy format', statusCode: 400 };
    }

    if (nextOrderDate && nextExpectedDelivery && new Date(nextExpectedDelivery) < new Date(nextOrderDate)) {
      return {
        success: false,
        message: 'expected_delivery must be greater than or equal to order_date',
        statusCode: 400,
      };
    }

    const payload: any = { ...updates };
    if (updates.po_number !== undefined) payload.po_number = normalizeOptionalText(updates.po_number);
    if (updates.items_description !== undefined) payload.items_description = normalizeOptionalText(updates.items_description);
    if (updates.notes !== undefined) payload.notes = normalizeOptionalText(updates.notes);
    if (updates.order_date !== undefined) payload.order_date = parseDate(updates.order_date);
    if (updates.expected_delivery !== undefined) payload.expected_delivery = parseDate(updates.expected_delivery);

    await purchaseOrder.update(payload);

    const withAssociations = await PurchaseOrder.findByPk(id, { include: purchaseOrderInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updatePurchaseOrder error:', error);
    return { success: false, message: 'Error updating purchase order' };
  }
};

export const deletePurchaseOrder = async (id: number) => {
  try {
    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) return { success: false, message: 'Purchase order not found' };

    await purchaseOrder.update({ deleted_at: new Date() } as any);
    return { success: true, message: 'Purchase order deleted' };
  } catch (error) {
    console.error('deletePurchaseOrder error:', error);
    return { success: false, message: 'Error deleting purchase order' };
  }
};
