import { Router } from 'express';
import { create, list, getById, update, remove, dropdown } from './companyController';
import validateRequest from '../middlewares/validateRequest';
import {
  createCompanySchema,
  updateCompanySchema,
  listCompaniesSchema,
  dropdownCompaniesSchema,
  idParamSchema,
} from './companyValidator';

const router = Router();

router.post('/', validateRequest(createCompanySchema, 'body'), create);
router.get('/dropdown', validateRequest(dropdownCompaniesSchema, 'query'), dropdown);
router.get('/', validateRequest(listCompaniesSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateCompanySchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
