import { Router } from 'express';
import validateRequest from '../middlewares/validateRequest';
import { create, list, remove } from './questionController';
import { createQuestionSchema, idParamSchema } from './questionValidator';

const router = Router();

router.post('/', validateRequest(createQuestionSchema, 'body'), create);
router.get('/', list);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
