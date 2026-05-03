import { Router } from 'express';
import validateRequest from '../middlewares/validateRequest';
import { create, list, remove, update } from './questionController';
import { createQuestionSchema, idParamSchema } from './questionValidator';

const router = Router();

router.post('/', validateRequest(createQuestionSchema, 'body'), create);
router.get('/', list);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(createQuestionSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
