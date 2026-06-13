import { Router } from 'express';
import { list, create, update, remove } from './roleController';
import validateRequest from '../middlewares/validateRequest';
import { createRoleSchema, updateRoleSchema } from './roleValidator';

const router = Router();

router.get('/', list);
router.post('/', validateRequest(createRoleSchema, 'body'), create);
router.put('/:id', validateRequest(updateRoleSchema, 'body'), update);
router.delete('/:id', remove);

export default router;
