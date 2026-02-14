import { Router } from 'express';
import {
  create,
  list,
  statuses,
  getById,
  statusHistory,
  update,
  remove,
  createService,
  listServices,
  getServiceById,
  updateService,
  removeService,
} from './ticketController';
import validateRequest from '../middlewares/validateRequest';
import {
  createTicketSchema,
  updateTicketSchema,
  listTicketsSchema,
  idParamSchema,
  ticketServiceParamSchema,
  ticketServiceIdParamSchema,
  createTicketServiceSchema,
  updateTicketServiceSchema,
} from './ticketValidator';

const router = Router();

router.post('/', validateRequest(createTicketSchema, 'body'), create);
router.get('/', validateRequest(listTicketsSchema, 'query'), list);
router.get('/statuses', statuses);
router.get('/:id/status-history', validateRequest(idParamSchema, 'params'), statusHistory);
router.get('/:id', validateRequest(idParamSchema, 'params'), getById);
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateTicketSchema, 'body'),
  update
);
router.delete('/:id', validateRequest(idParamSchema, 'params'), remove);

router.post(
  '/:ticketId/services',
  validateRequest(ticketServiceParamSchema, 'params'),
  validateRequest(createTicketServiceSchema, 'body'),
  createService
);
router.get('/:ticketId/services', validateRequest(ticketServiceParamSchema, 'params'), listServices);
router.get('/:ticketId/services/:serviceId', validateRequest(ticketServiceIdParamSchema, 'params'), getServiceById);
router.put(
  '/:ticketId/services/:serviceId',
  validateRequest(ticketServiceIdParamSchema, 'params'),
  validateRequest(updateTicketServiceSchema, 'body'),
  updateService
);
router.delete('/:ticketId/services/:serviceId', validateRequest(ticketServiceIdParamSchema, 'params'), removeService);

export default router;
