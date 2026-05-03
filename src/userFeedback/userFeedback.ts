import { Router } from 'express';
import validateRequest from '../middlewares/validateRequest';
import { create, list, remove, update } from './userFeedbackController';
import {
  createUserFeedbackSchema,
  idParamSchema,
  listUserFeedbackSchema,
  updateUserFeedbackSchema,
} from './userFeedbackValidator';

const router = Router();

router.post('/', validateRequest(createUserFeedbackSchema, 'body'), create);
router.get('/', validateRequest(listUserFeedbackSchema, 'query'), list);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateUserFeedbackSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
