import { Router } from 'express';
import validateRequest from '../middlewares/validateRequest';
import {
  create,
  createStatus,
  dropdown,
  getById,
  getStatusById,
  list,
  listStatuses,
  remove,
  removeStatus,
  statusDropdown,
  update,
  updateStatus,
} from './leadController';
import {
  createLeadSchema,
  createLeadStatusSchema,
  idParamSchema,
  leadDropdownSchema,
  leadStatusDropdownSchema,
  listLeadsSchema,
  listLeadStatusesSchema,
  updateLeadSchema,
  updateLeadStatusSchema,
} from './leadValidator';

const router = Router();

router.post('/', validateRequest(createLeadSchema, 'body'), create);
router.get('/dropdown', validateRequest(leadDropdownSchema, 'query'), dropdown);
router.get('/', validateRequest(listLeadsSchema, 'query'), list);

router.post('/statuses', validateRequest(createLeadStatusSchema, 'body'), createStatus);
router.get('/statuses/dropdown', validateRequest(leadStatusDropdownSchema, 'query'), statusDropdown);
router.get('/statuses', validateRequest(listLeadStatusesSchema, 'query'), listStatuses);
router.get('/statuses/:id', validateRequest(idParamSchema, 'params'), getStatusById);
router.put(
  '/statuses/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateLeadStatusSchema, 'body'),
  updateStatus
);
router.delete('/statuses/:id', validateRequest(idParamSchema, 'params'), removeStatus);

router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateLeadSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
