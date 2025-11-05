import { Router } from 'express';
import { searchEvents, getSuggestions, getEventDetails } from '../controllers/eventController';

const router = Router();

router.get('/search', searchEvents);
router.get('/suggestions', getSuggestions);
router.get('/:id', getEventDetails);

export default router;

