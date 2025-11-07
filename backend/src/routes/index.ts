import { Router } from 'express';
import eventRoutes from './eventRoutes';
import favoriteRoutes from './favoriteRoutes';

const router = Router();

router.use('/events', eventRoutes);
router.use('/favorites', favoriteRoutes);

export default router;

