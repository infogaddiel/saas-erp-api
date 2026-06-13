import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
  bulkCreate,
  exportExcel,
  dropdown,
  listCustomerTypes,
  createDetail,
  listDetails,
  getDetailById,
  updateDetail,
  removeDetail,
} from './customerController';
import validateRequest from '../middlewares/validateRequest';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  idParamSchema,
  bulkCreateCustomersSchema,
  createCustomerDetailSchema,
  updateCustomerDetailSchema,
  customerDetailParamSchema,
} from './customerValidator';

const router = Router();

router.post('/', validateRequest(createCustomerSchema, 'body'), create);
router.post('/bulk/create', validateRequest(bulkCreateCustomersSchema, 'body'), bulkCreate);
router.get('/export/excel', exportExcel);
router.get('/customer-types', listCustomerTypes);
router.get('/dropdown', dropdown);
router.get('/', validateRequest(listCustomersSchema, 'query'), list);
router.post('/:id/details', validateRequest(idParamSchema, 'params'), validateRequest(createCustomerDetailSchema, 'body'), createDetail);
router.get('/:id/details', validateRequest(idParamSchema, 'params'), listDetails);
router.get('/:id/details/:detailId', validateRequest(customerDetailParamSchema, 'params'), getDetailById);
router.put(
  '/:id/details/:detailId',
  validateRequest(customerDetailParamSchema, 'params'),
  validateRequest(updateCustomerDetailSchema, 'body'),
  updateDetail
);
router.delete('/:id/details/:detailId', validateRequest(customerDetailParamSchema, 'params'), removeDetail);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateCustomerSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
