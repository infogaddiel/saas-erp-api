import { Router } from 'express';
import { create, exportExcel, getById, list, remove, update } from './invoiceController';
import validateRequest from '../middlewares/validateRequest';
import { createInvoiceSchema, idParamSchema, listInvoicesSchema, updateInvoiceSchema } from './invoiceValidator';

const router = Router();

router.post('/', validateRequest(createInvoiceSchema, 'body'), create);
router.get('/', validateRequest(listInvoicesSchema, 'query'), list);
router.get('/export/excel', exportExcel);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateInvoiceSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
