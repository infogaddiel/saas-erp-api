import { Router } from 'express';
import validateRequest from '../middlewares/validateRequest';
import { create, getById, list, remove, update } from './contractController';
import {
  createContractSchema,
  idParamSchema,
  listContractsSchema,
  updateContractSchema,
} from './contractValidator';

const router = Router();

router.post('/', validateRequest(createContractSchema, 'body'), create);
router.get('/', validateRequest(listContractsSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateContractSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
