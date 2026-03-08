import { Router } from 'express';
import { create, getById, list, remove, update } from './vendorController';
import validateRequest from '../middlewares/validateRequest';
import { createVendorSchema, idParamSchema, listVendorsSchema, updateVendorSchema } from './vendorValidator';

const router = Router();

router.post('/', validateRequest(createVendorSchema, 'body'), create);
router.get('/', validateRequest(listVendorsSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateVendorSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
