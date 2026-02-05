import { Router, Request, Response } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '../services/userService';
import validateRequest from '../middlewares/validateRequest';
import { createUserSchema, updateUserSchema, listUsersSchema, idParamSchema } from '../validators/userValidator';

const router = Router();

router.post('/', validateRequest(createUserSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, password, company_id, role_id, blocked } = req.body;

    const result = await createUser({ name, mobile, email, password, company_id, role_id, blocked });
    if (!result.success) return res.status(400).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create user route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.get('/', validateRequest(listUsersSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await getUsers(page, limit);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List users route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.get('/:id', validateRequest(idParamSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getUserById(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get user route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateUserSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    const result = await updateUser(id, updates);
    if (!result.success) return res.status(400).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update user route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.delete('/:id', validateRequest(idParamSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteUser(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete user route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

export default router;
