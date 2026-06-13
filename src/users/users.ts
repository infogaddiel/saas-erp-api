import { Router } from 'express';
import { create, list, getById, update, remove, dropdown, dashboard } from './userController';
import validateRequest from '../middlewares/validateRequest';
import { createUserSchema, updateUserSchema, listUsersSchema, idParamSchema, dropdownUsersSchema } from './userValidator';

const router = Router();

router.post('/', validateRequest(createUserSchema, 'body'), create);
router.get('/dashboard', dashboard);
router.get('/dropdown', validateRequest(dropdownUsersSchema, 'query'), dropdown);
router.get('/', validateRequest(listUsersSchema, 'query'), list);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateUserSchema, 'body'), update);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
