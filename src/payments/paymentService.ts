import { Op } from 'sequelize';
import { Invoice, Payment } from '../models';

interface CreatePaymentInput {
  pay_to: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  category: string;
  transaction_reference?: string | null;
  notes?: string | null;
  invoice_id?: number | null;
}

interface UpdatePaymentInput extends Partial<CreatePaymentInput> {}

interface ListPaymentsFilters {
  payment_date_from?: string;
  payment_date_to?: string;
}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const paymentInclude = [
  { model: Invoice, as: 'invoice', attributes: ['id', 'customer_name', 'invoice_date', 'total_amount'], required: false },
];

export const createPayment = async (data: CreatePaymentInput) => {
  try {
    if (data.invoice_id != null) {
      const invoice = await Invoice.findByPk(data.invoice_id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found', statusCode: 404 };
      }
    }

    const payment = await Payment.create({
      pay_to: data.pay_to,
      payment_date: data.payment_date,
      amount: data.amount,
      payment_method: data.payment_method,
      category: data.category,
      transaction_reference: normalizeOptionalText(data.transaction_reference),
      notes: normalizeOptionalText(data.notes),
      invoice_id: data.invoice_id ?? null,
    } as any);

    const withInvoice = await Payment.findByPk(payment.id, { include: paymentInclude });
    return { success: true, data: withInvoice };
  } catch (error) {
    console.error('createPayment error:', error);
    return { success: false, message: 'Error creating payment' };
  }
};

export const getPayments = async (
  page = 1,
  limit = 20,
  filters: ListPaymentsFilters = {}
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters.payment_date_from && filters.payment_date_from.trim() !== '') {
      where.payment_date = where.payment_date || {};
      where.payment_date[Op.gte] = filters.payment_date_from.trim();
    }
    if (filters.payment_date_to && filters.payment_date_to.trim() !== '') {
      where.payment_date = where.payment_date || {};
      where.payment_date[Op.lte] = filters.payment_date_to.trim();
    }

    const { rows, count } = await Payment.findAndCountAll({
      where,
      include: paymentInclude,
      order: [['payment_date', 'DESC'], ['id', 'DESC']],
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
    console.error('getPayments error:', error);
    return { success: false, message: 'Error fetching payments' };
  }
};

export const getPaymentById = async (id: number) => {
  try {
    const payment = await Payment.findByPk(id, { include: paymentInclude });
    if (!payment) return { success: false, message: 'Payment not found' };
    return { success: true, data: payment };
  } catch (error) {
    console.error('getPaymentById error:', error);
    return { success: false, message: 'Error fetching payment' };
  }
};

export const updatePayment = async (id: number, updates: UpdatePaymentInput) => {
  try {
    const payment: any = await Payment.findByPk(id);
    if (!payment) return { success: false, message: 'Payment not found' };

    if (updates.invoice_id != null) {
      const invoice = await Invoice.findByPk(updates.invoice_id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found', statusCode: 404 };
      }
    }

    const payload: any = { ...updates };
    if (updates.transaction_reference !== undefined) payload.transaction_reference = normalizeOptionalText(updates.transaction_reference);
    if (updates.notes !== undefined) payload.notes = normalizeOptionalText(updates.notes);

    await payment.update(payload);

    const withInvoice = await Payment.findByPk(id, { include: paymentInclude });
    return { success: true, data: withInvoice };
  } catch (error) {
    console.error('updatePayment error:', error);
    return { success: false, message: 'Error updating payment' };
  }
};

export const deletePayment = async (id: number) => {
  try {
    const payment: any = await Payment.findByPk(id);
    if (!payment) return { success: false, message: 'Payment not found' };

    await payment.update({ deleted_at: new Date() });
    return { success: true, message: 'Payment deleted' };
  } catch (error) {
    console.error('deletePayment error:', error);
    return { success: false, message: 'Error deleting payment' };
  }
};
