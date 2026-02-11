import { Router } from 'express';
import { create, list, getById, statusHistory, update, remove } from './ticketController';
import validateRequest from '../middlewares/validateRequest';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsSchema,
  idParamSchema,
} from './ticketValidator';

const router = Router();

router.post('/', validateRequest(createTicketSchema, 'body'), create);
router.get('/', validateRequest(listTicketsSchema, 'query'), list);
router.get('/:id/status-history', validateRequest(idParamSchema, 'params'), statusHistory);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateTicketSchema, 'body'),
  update
);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

export default router;
