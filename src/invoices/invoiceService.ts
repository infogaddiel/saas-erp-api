import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Invoice, InvoiceLineItem, Item, User } from '../models';
import ExcelJS from 'exceljs';

interface InvoiceLineItemInput {
  item_id: number;
  unit?: number;
  price?: number;
  quantity?: number;
  discount?: number;
  discount_amount?: number;
  tax?: number;
  tax_amount?: number;
  final_price?: number;
}

interface CreateInvoiceInput {
  customer_name: string;
  payment_status?: string | null;
  invoice_date?: string | null;
  due_date?: string | null;
  sub_total?: number;
  tax_amount?: number;
  total_amount?: number;
  amount_paid?: number;
  line_items?: InvoiceLineItemInput[];
  notes?: string | null;
  created_by?: number | null;
}

interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {}

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const normalizeOptionalDateOnly = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const invoiceInclude = [
  { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
  {
    model: InvoiceLineItem,
    as: 'lineItems',
    required: false,
    include: [{ model: Item, as: 'item', attributes: ['id', 'item_code', 'item_name', 'unit_price', 'gst_percentage', 'unit'] }],
  },
];

const ensureItemsExist = async (lineItems: InvoiceLineItemInput[]) => {
  const uniqueItemIds = Array.from(new Set(lineItems.map((li) => li.item_id)));
  if (uniqueItemIds.length === 0) return { ok: true as const };

  const items = await Item.findAll({ where: { id: uniqueItemIds }, attributes: ['id'] });
  const foundIds = new Set(items.map((i: any) => i.id));
  const missing = uniqueItemIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return { ok: false as const, missing };
  }
  return { ok: true as const };
};

export const createInvoice = async (data: CreateInvoiceInput) => {
  try {
    const normalizedPaymentStatus = normalizeOptionalText(data.payment_status);
    const normalizedNotes = normalizeOptionalText(data.notes);
    const invoiceDate = normalizeOptionalDateOnly(data.invoice_date);
    const dueDate = normalizeOptionalDateOnly(data.due_date);

    if (invoiceDate && dueDate && new Date(dueDate) < new Date(invoiceDate)) {
      return { success: false, message: 'due_date must be greater than or equal to invoice_date', statusCode: 400 };
    }

    const lineItems = Array.isArray(data.line_items) ? data.line_items : [];
    const existsCheck = await ensureItemsExist(lineItems);
    if (!existsCheck.ok) {
      return { success: false, message: `Item not found: ${existsCheck.missing.join(', ')}`, statusCode: 404 };
    }

    const created = await sequelize.transaction(async (transaction) => {
      const invoice = await Invoice.create(
        {
          customer_name: data.customer_name,
          payment_status: normalizedPaymentStatus,
          invoice_date: invoiceDate,
          due_date: dueDate,
          sub_total: data.sub_total ?? 0,
          tax_amount: data.tax_amount ?? 0,
          total_amount: data.total_amount ?? 0,
          amount_paid: data.amount_paid ?? 0,
          notes: normalizedNotes,
          created_by: data.created_by ?? null,
        } as any,
        { transaction }
      );

      if (lineItems.length > 0) {
        await InvoiceLineItem.bulkCreate(
          lineItems.map((li) => ({
            invoice_id: (invoice as any).id,
            item_id: li.item_id,
            unit: li.unit ?? 0,
            price: li.price ?? 0,
            quantity: li.quantity ?? 0,
            discount: li.discount ?? 0,
            discount_amount: li.discount_amount ?? 0,
            tax: li.tax ?? 0,
            tax_amount: li.tax_amount ?? 0,
            final_price: li.final_price ?? 0,
          })),
          { transaction }
        );
      }

      return invoice;
    });

    const withAssociations = await Invoice.findByPk((created as any).id, { include: invoiceInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('createInvoice error:', error);
    return { success: false, message: 'Error creating invoice' };
  }
};

export const getInvoices = async (
  page = 1,
  limit = 20,
  filters: { payment_status?: string; customer_name?: string } = {}
) => {
  try {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters.payment_status && filters.payment_status.trim() !== '') {
      where.payment_status = filters.payment_status.trim();
    }
    if (filters.customer_name && filters.customer_name.trim() !== '') {
      where.customer_name = { [Op.iLike]: `%${filters.customer_name.trim()}%` };
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: invoiceInclude,
      order: [['id', 'DESC']],
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
    console.error('getInvoices error:', error);
    return { success: false, message: 'Error fetching invoices' };
  }
};

export const getInvoiceById = async (id: number) => {
  try {
    const invoice = await Invoice.findByPk(id, { include: invoiceInclude });
    if (!invoice) return { success: false, message: 'Invoice not found' };
    return { success: true, data: invoice };
  } catch (error) {
    console.error('getInvoiceById error:', error);
    return { success: false, message: 'Error fetching invoice' };
  }
};

export const updateInvoice = async (id: number, updates: UpdateInvoiceInput) => {
  try {
    const invoice: any = await Invoice.findByPk(id);
    if (!invoice) return { success: false, message: 'Invoice not found' };

    const nextInvoiceDate =
      updates.invoice_date === undefined ? (invoice.invoice_date ? String(invoice.invoice_date) : null) : normalizeOptionalDateOnly(updates.invoice_date);
    const nextDueDate =
      updates.due_date === undefined ? (invoice.due_date ? String(invoice.due_date) : null) : normalizeOptionalDateOnly(updates.due_date);

    if (nextInvoiceDate && nextDueDate && new Date(nextDueDate) < new Date(nextInvoiceDate)) {
      return { success: false, message: 'due_date must be greater than or equal to invoice_date', statusCode: 400 };
    }

    const lineItemsProvided = updates.line_items !== undefined;
    const nextLineItems = Array.isArray(updates.line_items) ? updates.line_items : [];

    if (lineItemsProvided) {
      const existsCheck = await ensureItemsExist(nextLineItems);
      if (!existsCheck.ok) {
        return { success: false, message: `Item not found: ${existsCheck.missing.join(', ')}`, statusCode: 404 };
      }
    }

    await sequelize.transaction(async (transaction) => {
      const payload: any = { ...updates };
      if (updates.payment_status !== undefined) payload.payment_status = normalizeOptionalText(updates.payment_status);
      if (updates.notes !== undefined) payload.notes = normalizeOptionalText(updates.notes);
      if (updates.invoice_date !== undefined) payload.invoice_date = normalizeOptionalDateOnly(updates.invoice_date);
      if (updates.due_date !== undefined) payload.due_date = normalizeOptionalDateOnly(updates.due_date);

      await invoice.update(payload, { transaction });

      if (lineItemsProvided) {
        await InvoiceLineItem.destroy({ where: { invoice_id: id }, transaction });
        if (nextLineItems.length > 0) {
          await InvoiceLineItem.bulkCreate(
            nextLineItems.map((li) => ({
              invoice_id: id,
              item_id: li.item_id,
              unit: li.unit ?? 0,
              price: li.price ?? 0,
              quantity: li.quantity ?? 0,
              discount: li.discount ?? 0,
              discount_amount: li.discount_amount ?? 0,
              tax: li.tax ?? 0,
              tax_amount: li.tax_amount ?? 0,
              final_price: li.final_price ?? 0,
            })),
            { transaction }
          );
        }
      }
    });

    const withAssociations = await Invoice.findByPk(id, { include: invoiceInclude });
    return { success: true, data: withAssociations };
  } catch (error) {
    console.error('updateInvoice error:', error);
    return { success: false, message: 'Error updating invoice' };
  }
};

export const deleteInvoice = async (id: number) => {
  try {
    const invoice: any = await Invoice.findByPk(id);
    if (!invoice) return { success: false, message: 'Invoice not found' };

    await invoice.update({ deleted_at: new Date() });
    return { success: true, message: 'Invoice deleted' };
  } catch (error) {
    console.error('deleteInvoice error:', error);
    return { success: false, message: 'Error deleting invoice' };
  }
};

export const exportInvoicesToExcel = async () => {
  try {
    const invoices: any[] = await Invoice.findAll({
      include: invoiceInclude,
      order: [['id', 'ASC']],
    });

    const workbook = new ExcelJS.Workbook();

    const invoicesSheet = workbook.addWorksheet('Invoices');
    invoicesSheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Customer Name', key: 'customer_name', width: 28 },
      { header: 'Payment Status', key: 'payment_status', width: 16 },
      { header: 'Invoice Date', key: 'invoice_date', width: 14 },
      { header: 'Due Date', key: 'due_date', width: 14 },
      { header: 'Sub Total', key: 'sub_total', width: 14 },
      { header: 'Tax Amount', key: 'tax_amount', width: 14 },
      { header: 'Total Amount', key: 'total_amount', width: 14 },
      { header: 'Amount Paid', key: 'amount_paid', width: 14 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Created By', key: 'created_by_name', width: 20 },
      { header: 'Created At', key: 'created_at', width: 18 },
      { header: 'Updated At', key: 'updated_at', width: 18 },
    ];

    invoices.forEach((inv) => {
      invoicesSheet.addRow({
        id: inv.id,
        customer_name: inv.customer_name,
        payment_status: inv.payment_status ?? '',
        invoice_date: inv.invoice_date ?? '',
        due_date: inv.due_date ?? '',
        sub_total: inv.sub_total,
        tax_amount: inv.tax_amount,
        total_amount: inv.total_amount,
        amount_paid: inv.amount_paid,
        notes: inv.notes ?? '',
        created_by_name: inv.createdBy?.name ?? 'N/A',
        created_at: inv.created_at,
        updated_at: inv.updated_at,
      });
    });

    invoicesSheet.getRow(1).font = { bold: true };

    const lineItemsSheet = workbook.addWorksheet('Invoice Line Items');
    lineItemsSheet.columns = [
      { header: 'Invoice ID', key: 'invoice_id', width: 10 },
      { header: 'Line Item ID', key: 'line_item_id', width: 12 },
      { header: 'Item ID', key: 'item_id', width: 10 },
      { header: 'Item Code', key: 'item_code', width: 16 },
      { header: 'Item Name', key: 'item_name', width: 28 },
      { header: 'Unit', key: 'unit', width: 12 },
      { header: 'Price', key: 'price', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Discount', key: 'discount', width: 12 },
      { header: 'Discount Amount', key: 'discount_amount', width: 16 },
      { header: 'Tax', key: 'tax', width: 12 },
      { header: 'Tax Amount', key: 'tax_amount', width: 12 },
      { header: 'Final Price', key: 'final_price', width: 14 },
    ];

    invoices.forEach((inv) => {
      const items: any[] = Array.isArray(inv.lineItems) ? inv.lineItems : [];
      items.forEach((li) => {
        lineItemsSheet.addRow({
          invoice_id: inv.id,
          line_item_id: li.id,
          item_id: li.item_id,
          item_code: li.item?.item_code ?? '',
          item_name: li.item?.item_name ?? '',
          unit: li.unit,
          price: li.price,
          quantity: li.quantity,
          discount: li.discount,
          discount_amount: li.discount_amount,
          tax: li.tax,
          tax_amount: li.tax_amount,
          final_price: li.final_price,
        });
      });
    });

    lineItemsSheet.getRow(1).font = { bold: true };

    return { success: true, data: workbook };
  } catch (error) {
    console.error('exportInvoicesToExcel error:', error);
    return { success: false, message: 'Error exporting invoices', data: null };
  }
};
