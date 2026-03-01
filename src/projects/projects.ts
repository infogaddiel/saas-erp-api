import { Router } from 'express';
import validateRequest from '../middlewares/validateRequest';
import { bulkCreate, create, dropdown, exportExcel, getById, list, remove, update } from './projectController';
import {
  bulkCreateProjectsSchema,
  createProjectSchema,
  idParamSchema,
  listProjectsSchema,
  projectDropdownSchema,
  updateProjectSchema,
} from './projectValidator';

const router = Router();

router.post('/', validateRequest(createProjectSchema, 'body'), create);
router.post('/bulk/create', validateRequest(bulkCreateProjectsSchema, 'body'), bulkCreate);
router.get('/export/excel', exportExcel);
router.get('/dropdown', validateRequest(projectDropdownSchema, 'query'), dropdown);
router.get('/', validateRequest(listProjectsSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateProjectSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
