import { Op } from 'sequelize';
import { Invoice, Receipt } from '../models';

interface CreateReceiptInput {
  customer_name: string;
  receipt_date: string;
  amount: number;
  payment_method: string;
  invoice_id?: number | null;
  transaction_reference?: string | null;
  notes?: string | null;
}

interface UpdateReceiptInput extends Partial<CreateReceiptInput> {}

interface ListReceiptsFilters {
  date_from?: string;
  date_to?: string;
}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const receiptInclude = [{ model: Invoice, as: 'invoice', attributes: ['id', 'customer_name', 'invoice_date', 'total_amount'], required: false }];

export const createReceipt = async (data: CreateReceiptInput) => {
  try {
    if (data.invoice_id != null) {
      const invoice = await Invoice.findByPk(data.invoice_id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found', statusCode: 404 };
      }
    }

    const receipt = await Receipt.create({
      customer_name: data.customer_name,
      receipt_date: data.receipt_date,
      amount: data.amount,
      payment_method: data.payment_method ?? 'cash',
      invoice_id: data.invoice_id ?? null,
      transaction_reference: normalizeOptionalText(data.transaction_reference),
      notes: normalizeOptionalText(data.notes),
    } as any);

    const withInvoice = await Receipt.findByPk(receipt.id, { include: receiptInclude });
    return { success: true, data: withInvoice };
  } catch (error) {
    console.error('createReceipt error:', error);
    return { success: false, message: 'Error creating receipt' };
  }
};

export const getReceipts = async (
  page = 1,
  limit = 20,
  filters: ListReceiptsFilters = {}
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters.date_from && filters.date_from.trim() !== '') {
      where.receipt_date = where.receipt_date || {};
      where.receipt_date[Op.gte] = filters.date_from.trim();
    }
    if (filters.date_to && filters.date_to.trim() !== '') {
      where.receipt_date = where.receipt_date || {};
      where.receipt_date[Op.lte] = filters.date_to.trim();
    }

    const { rows, count } = await Receipt.findAndCountAll({
      where,
      include: receiptInclude,
      order: [['receipt_date', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
    });

    return {
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error('getReceipts error:', error);
    return { success: false, message: 'Error fetching receipts' };
  }
};

export const getReceiptById = async (id: number) => {
  try {
    const receipt = await Receipt.findByPk(id, { include: receiptInclude });
    if (!receipt) return { success: false, message: 'Receipt not found' };
    return { success: true, data: receipt };
  } catch (error) {
    console.error('getReceiptById error:', error);
    return { success: false, message: 'Error fetching receipt' };
  }
};

export const updateReceipt = async (id: number, updates: UpdateReceiptInput) => {
  try {
    const receipt: any = await Receipt.findByPk(id);
    if (!receipt) return { success: false, message: 'Receipt not found' };

    if (updates.invoice_id != null) {
      const invoice = await Invoice.findByPk(updates.invoice_id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found', statusCode: 404 };
      }
    }

    const payload: any = { ...updates };
    if (updates.transaction_reference !== undefined) payload.transaction_reference = normalizeOptionalText(updates.transaction_reference);
    if (updates.notes !== undefined) payload.notes = normalizeOptionalText(updates.notes);

    await receipt.update(payload);

    const withInvoice = await Receipt.findByPk(id, { include: receiptInclude });
    return { success: true, data: withInvoice };
  } catch (error) {
    console.error('updateReceipt error:', error);
    return { success: false, message: 'Error updating receipt' };
  }
};

export const deleteReceipt = async (id: number) => {
  try {
    const receipt: any = await Receipt.findByPk(id);
    if (!receipt) return { success: false, message: 'Receipt not found' };

    await receipt.update({ deleted_at: new Date() });
    return { success: true, message: 'Receipt deleted' };
  } catch (error) {
    console.error('deleteReceipt error:', error);
    return { success: false, message: 'Error deleting receipt' };
  }
};
