import { Router } from 'express';
import {
  searchEvents,
  getSuggestions,
  getEventDetails,
  getSpotifyToken,
  getSpotifyArtistDetails,
} from '../controllers/eventController';

const router = Router();

router.get('/search', searchEvents);
router.get('/suggestions', getSuggestions);
router.get('/spotify/token', getSpotifyToken);
router.get('/spotify/artist', getSpotifyArtistDetails);
router.get('/:id', getEventDetails);

export default router;

