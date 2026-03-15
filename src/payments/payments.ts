import { Router } from 'express';
import { create, getById, list, remove, update } from './paymentController';
import validateRequest from '../middlewares/validateRequest';
import { createPaymentSchema, idParamSchema, listPaymentsSchema, updatePaymentSchema } from './paymentValidator';

const router = Router();

router.post('/', validateRequest(createPaymentSchema, 'body'), create);
router.get('/', validateRequest(listPaymentsSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updatePaymentSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
