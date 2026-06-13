import { Router } from 'express';
import { create, exportExcel, getById, list, remove, update } from './debitNoteController';
import validateRequest from '../middlewares/validateRequest';
import {
  createCreditNoteSchema,
  exportCreditNotesQuerySchema,
  idParamSchema,
  listCreditNotesSchema,
  updateCreditNoteSchema,
} from '../creditNotes/creditNoteValidator';

const router = Router();

router.post('/', validateRequest(createCreditNoteSchema, 'body'), create);
router.get('/', validateRequest(listCreditNotesSchema, 'query'), list);
router.get('/export/excel', validateRequest(exportCreditNotesQuerySchema, 'query'), exportExcel);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateCreditNoteSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
