import { Router } from 'express';
import { create, list, getById, update, remove, bulkCreate, exportExcel } from './itemController';
import validateRequest from '../middlewares/validateRequest';
import {
  createItemSchema,
  updateItemSchema,
  listItemsSchema,
  idParamSchema,
  bulkCreateItemsSchema,
} from './itemValidator';

const router = Router();

router.post('/', validateRequest(createItemSchema, 'body'), create);
router.post('/bulk/create', validateRequest(bulkCreateItemsSchema, 'body'), bulkCreate);
router.get('/export/excel', exportExcel);
router.get('/', validateRequest(listItemsSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateItemSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
