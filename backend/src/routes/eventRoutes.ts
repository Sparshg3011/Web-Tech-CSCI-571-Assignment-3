import { Router } from 'express';
import { searchEvents, getSuggestions } from '../controllers/eventController';

const router = Router();

router.get('/search', searchEvents);
router.get('/suggestions', getSuggestions);

export default router;

