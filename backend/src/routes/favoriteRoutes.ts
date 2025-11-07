import { Router } from 'express';
import { listFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController';

const router = Router();

router.get('/', listFavorites);
router.post('/', addFavorite);
router.delete('/:id', removeFavorite);

export default router;


