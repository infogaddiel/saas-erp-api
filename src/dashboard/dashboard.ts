import { Router } from 'express';
import { generalOverview } from './dashboardController';

const router = Router();

router.get('/general-overview', generalOverview);

export default router;
