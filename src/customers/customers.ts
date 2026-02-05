import { Router } from 'express';
import { create, list, getById, update, remove } from './customerController';
import validateRequest from '../middlewares/validateRequest';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  idParamSchema,
} from './customerValidator';

const router = Router();

router.post('/', validateRequest(createCustomerSchema, 'body'), create);
router.get('/', validateRequest(listCustomersSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateCustomerSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
