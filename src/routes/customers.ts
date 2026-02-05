import { Router, Request, Response } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '../services/customerService';
import validateRequest from '../middlewares/validateRequest';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersSchema,
  idParamSchema,
} from '../validators/customerValidator';

const router = Router();

router.post('/', validateRequest(createCustomerSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, address, type, status, created_by } = req.body;

    const result = await createCustomer({ name, mobile, email, address, type, status, created_by });

    if (!result.success) return res.status(500).json(result);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Create customer route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.get('/', validateRequest(listCustomersSchema, 'query'), async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await getCustomers(page, limit);
    if (!result.success) return res.status(500).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('List customers route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.get('/:id', validateRequest(idParamSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await getCustomerById(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get customer route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateCustomerSchema, 'body'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body;

    const result = await updateCustomer(id, updates);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update customer route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

router.delete('/:id', validateRequest(idParamSchema, 'params'), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await deleteCustomer(id);
    if (!result.success) return res.status(404).json(result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Delete customer route error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred' });
  }
});

export default router;
