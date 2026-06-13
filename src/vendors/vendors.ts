import { Router } from 'express';
import { bulkCreate, create, dropdown, exportExcel, getById, list, remove, update } from './vendorController';
import validateRequest from '../middlewares/validateRequest';
import {
  bulkCreateVendorsSchema,
  createVendorSchema,
  dropdownVendorsSchema,
  idParamSchema,
  listVendorsSchema,
  updateVendorSchema,
} from './vendorValidator';

const router = Router();

router.post('/', validateRequest(createVendorSchema, 'body'), create);
router.post('/bulk/create', validateRequest(bulkCreateVendorsSchema, 'body'), bulkCreate);
router.get('/export/excel', exportExcel);
router.get('/', validateRequest(listVendorsSchema, 'query'), list);
router.get('/dropdown', validateRequest(dropdownVendorsSchema, 'query'), dropdown);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateVendorSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
