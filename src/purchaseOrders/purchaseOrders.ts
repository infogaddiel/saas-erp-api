import { Router } from 'express';
import { create, getById, list, remove, update } from './purchaseOrderController';
import validateRequest from '../middlewares/validateRequest';
import {
  createPurchaseOrderSchema,
  idParamSchema,
  listPurchaseOrdersSchema,
  updatePurchaseOrderSchema,
} from './purchaseOrderValidator';

const router = Router();

router.post('/', validateRequest(createPurchaseOrderSchema, 'body'), create);
router.get('/', validateRequest(listPurchaseOrdersSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updatePurchaseOrderSchema, 'body'),
  update
);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
