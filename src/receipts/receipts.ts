import { Router } from 'express';
import { create, getById, list, remove, update } from './receiptController';
import validateRequest from '../middlewares/validateRequest';
import { createReceiptSchema, idParamSchema, listReceiptsSchema, updateReceiptSchema } from './receiptValidator';

const router = Router();

router.post('/', validateRequest(createReceiptSchema, 'body'), create);
router.get('/', validateRequest(listReceiptsSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateReceiptSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
