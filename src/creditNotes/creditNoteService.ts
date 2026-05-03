import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import { CreditNote, Invoice } from '../models';
import type { CreditDebitNoteType } from '../models/CreditNote';

interface CreateNoteInput {
  customer_name: string;
  invoice_id?: number | null;
  issue_date: string;
  amount: number;
  reason: string;
  status: string;
  description?: string | null;
  notes?: string | null;
}

interface UpdateNoteInput extends Partial<CreateNoteInput> { }

interface ListNotesFilters {
  date_from?: string;
  date_to?: string;
}

interface ExportNotesFilters {
  date_from?: string;
  date_to?: string;
}
const DEFAULT_CRN_PREFIX = 'SEM';
const CRN_NUMBER_MIDDLE = 'CRN';
const DBN_NUMBER_MIDDLE = 'DBN';
const normalizeOptionalText = (value: string | null | undefined): string | null => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized === '' ? null : normalized;
};

const creditNoteInclude = [
  { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number', 'customer_name', 'invoice_date', 'total_amount'], required: false },
];

const buildDateRangeWhere = (date_from?: string, date_to?: string): any => {
  const where: any = {};
  if (date_from && date_from.trim() !== '') {
    where.issue_date = where.issue_date || {};
    where.issue_date[Op.gte] = date_from.trim();
  }
  if (date_to && date_to.trim() !== '') {
    where.issue_date = where.issue_date || {};
    where.issue_date[Op.lte] = date_to.trim();
  }
  return where;
};

const mergeWhereWithType = (type: CreditDebitNoteType, dateFrom?: string, dateTo?: string): any => ({
  type,
  ...buildDateRangeWhere(dateFrom, dateTo),
});

const noteLabel = (type: CreditDebitNoteType) => (type === 'credit' ? 'Credit note' : 'Debit note');

export const createCreditNote = async (data: CreateNoteInput, companyCode?: string | null) => {
  return createNote('credit', data, companyCode);
};

export const createDebitNote = async (data: CreateNoteInput, companyCode?: string | null) => {
  return createNote('debit', data, companyCode);
};

const getCompanyPrefix = (companyCode: string | null | undefined): string => {
  if (!companyCode) return DEFAULT_CRN_PREFIX;
  const normalized = companyCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (normalized.length !== 3) return CRN_NUMBER_MIDDLE;
  return normalized;
};

const generateNextCrnNumber = async (
  companyCode: string | null | undefined, noteType: CreditDebitNoteType): Promise<string> => {
  const prefix = getCompanyPrefix(companyCode);
  const numberPrefix = noteType === 'credit' ? `${prefix}${CRN_NUMBER_MIDDLE}00` : `${prefix}${DBN_NUMBER_MIDDLE}00`;

  const invoiceCount = await CreditNote.unscoped().count({
    where: { type: noteType, deleted_at: { [Op.is]: null } },
  });

  return `${numberPrefix}${invoiceCount + 1}`;
};

const createNote = async (noteType: CreditDebitNoteType, data: CreateNoteInput, companyCode?: string | null) => {
  try {
    if (data.invoice_id != null) {
      const invoice = await Invoice.findByPk(data.invoice_id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found', statusCode: 404 };
      }
    }
    const crnNumber = await generateNextCrnNumber(companyCode, noteType);
    const record = await CreditNote.create({
      type: noteType,
      customer_name: data.customer_name,
      crn_number: crnNumber,
      invoice_id: data.invoice_id ?? null,
      issue_date: data.issue_date,
      amount: data.amount,
      reason: data.reason,
      status: data.status,
      description: normalizeOptionalText(data.description),
      notes: normalizeOptionalText(data.notes),
    } as any);

    const withInvoice = await CreditNote.findByPk(record.id, { include: creditNoteInclude });
    return { success: true, data: withInvoice };
  } catch (error) {
    console.error(`create${noteType === 'credit' ? 'Credit' : 'Debit'}Note error:`, error);
    return { success: false, message: `Error creating ${noteLabel(noteType).toLowerCase()}` };
  }
};

export const getCreditNotes = async (
  page = 1,
  limit = 20,
  filters: ListNotesFilters = {}
) => {
  return getNotes('credit', page, limit, filters);
};

export const getDebitNotes = async (
  page = 1,
  limit = 20,
  filters: ListNotesFilters = {}
) => {
  return getNotes('debit', page, limit, filters);
};

const getNotes = async (
  noteType: CreditDebitNoteType,
  page = 1,
  limit = 20,
  filters: ListNotesFilters = {}
) => {
  try {
    const offset = (page - 1) * limit;
    const where = mergeWhereWithType(noteType, filters.date_from, filters.date_to);

    const { rows, count } = await CreditNote.findAndCountAll({
      where,
      include: creditNoteInclude,
      order: [['issue_date', 'DESC'], ['id', 'DESC']],
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
    console.error(`get${noteType === 'credit' ? 'Credit' : 'Debit'}Notes error:`, error);
    return { success: false, message: `Error fetching ${noteLabel(noteType).toLowerCase()}s` };
  }
};

export const getCreditNoteById = async (id: number) => {
  return getNoteById(id, 'credit');
};

export const getDebitNoteById = async (id: number) => {
  return getNoteById(id, 'debit');
};

const getNoteById = async (id: number, noteType: CreditDebitNoteType) => {
  try {
    const record = await CreditNote.findByPk(id, { include: creditNoteInclude });
    if (!record) return { success: false, message: `${noteLabel(noteType)} not found` };
    const rec: any = record;
    if (rec.type !== noteType) return { success: false, message: `${noteLabel(noteType)} not found` };
    return { success: true, data: record };
  } catch (error) {
    console.error(`get${noteType === 'credit' ? 'Credit' : 'Debit'}NoteById error:`, error);
    return { success: false, message: `Error fetching ${noteLabel(noteType).toLowerCase()}` };
  }
};

export const updateCreditNote = async (id: number, updates: UpdateNoteInput) => {
  return updateNote(id, 'credit', updates);
};

export const updateDebitNote = async (id: number, updates: UpdateNoteInput) => {
  return updateNote(id, 'debit', updates);
};

const updateNote = async (id: number, noteType: CreditDebitNoteType, updates: UpdateNoteInput) => {
  try {
    const record: any = await CreditNote.findByPk(id);
    if (!record) return { success: false, message: `${noteLabel(noteType)} not found` };
    if (record.type !== noteType) return { success: false, message: `${noteLabel(noteType)} not found` };

    if (updates.invoice_id != null) {
      const invoice = await Invoice.findByPk(updates.invoice_id);
      if (!invoice) {
        return { success: false, message: 'Invoice not found', statusCode: 404 };
      }
    }

    const payload: any = { ...updates };
    if (updates.description !== undefined) payload.description = normalizeOptionalText(updates.description);
    if (updates.notes !== undefined) payload.notes = normalizeOptionalText(updates.notes);

    await record.update(payload);

    const withInvoice = await CreditNote.findByPk(id, { include: creditNoteInclude });
    return { success: true, data: withInvoice };
  } catch (error) {
    console.error(`update${noteType === 'credit' ? 'Credit' : 'Debit'}Note error:`, error);
    return { success: false, message: `Error updating ${noteLabel(noteType).toLowerCase()}` };
  }
};

export const deleteCreditNote = async (id: number) => {
  return deleteNote(id, 'credit');
};

export const deleteDebitNote = async (id: number) => {
  return deleteNote(id, 'debit');
};

const deleteNote = async (id: number, noteType: CreditDebitNoteType) => {
  try {
    const record: any = await CreditNote.findByPk(id);
    if (!record) return { success: false, message: `${noteLabel(noteType)} not found` };
    if (record.type !== noteType) return { success: false, message: `${noteLabel(noteType)} not found` };

    await record.update({ deleted_at: new Date() });
    return { success: true, message: `${noteLabel(noteType)} deleted` };
  } catch (error) {
    console.error(`delete${noteType === 'credit' ? 'Credit' : 'Debit'}Note error:`, error);
    return { success: false, message: `Error deleting ${noteLabel(noteType).toLowerCase()}` };
  }
};

export const exportCreditNotesToExcel = async (filters: ExportNotesFilters = {}) => {
  return exportNotesToExcel('credit', filters);
};

export const exportDebitNotesToExcel = async (filters: ExportNotesFilters = {}) => {
  return exportNotesToExcel('debit', filters);
};

const exportNotesToExcel = async (noteType: CreditDebitNoteType, filters: ExportNotesFilters = {}) => {
  try {
    const where = mergeWhereWithType(noteType, filters.date_from, filters.date_to);
    const sheetName = noteType === 'credit' ? 'Credit Notes' : 'Debit Notes';

    const rows: any[] = await CreditNote.findAll({
      where,
      include: creditNoteInclude,
      order: [['issue_date', 'DESC'], ['id', 'ASC']],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Customer Name', key: 'customer_name', width: 28 },
      { header: 'Related Invoice ID', key: 'invoice_id', width: 16 },
      { header: 'Issue Date', key: 'issue_date', width: 14 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Reason', key: 'reason', width: 18 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Notes', key: 'notes', width: 40 },
      { header: 'Created At', key: 'created_at', width: 18 },
      { header: 'Updated At', key: 'updated_at', width: 18 },
    ];

    rows.forEach((cn) => {
      sheet.addRow({
        id: cn.id,
        type: cn.type ?? noteType,
        customer_name: cn.customer_name,
        invoice_id: cn.invoice_id ?? '',
        issue_date: cn.issue_date ?? '',
        amount: cn.amount,
        reason: cn.reason ?? '',
        status: cn.status ?? '',
        description: cn.description ?? '',
        notes: cn.notes ?? '',
        created_at: cn.created_at,
        updated_at: cn.updated_at,
      });
    });

    sheet.getRow(1).font = { bold: true };

    return { success: true, data: workbook };
  } catch (error) {
    console.error(`export${noteType === 'credit' ? 'Credit' : 'Debit'}NotesToExcel error:`, error);
    return { success: false, message: `Error exporting ${noteLabel(noteType).toLowerCase()}s`, data: null };
  }
};
