import type { Request, Response } from 'express';
import * as favoriteService from '../services/favoriteService';
import type { FavoriteEventPayload } from '../types';

const isValidFavoritePayload = (payload: Partial<FavoriteEventPayload>): payload is FavoriteEventPayload => {
  return Boolean(payload.id && payload.name);
};

export const listFavorites = async (_req: Request, res: Response): Promise<void> => {
  try {
    const favorites = await favoriteService.getFavorites();
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
};

export const addFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body as Partial<FavoriteEventPayload>;

    if (!isValidFavoritePayload(payload)) {
      res.status(400).json({ error: 'Invalid favorite payload' });
      return;
    }

    const { favorite, created } = await favoriteService.addFavorite(payload);
    res.status(created ? 201 : 200).json(favorite);
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
};

export const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Favorite id is required' });
      return;
    }

    const removed = await favoriteService.removeFavorite(id);
    res.json({ removed });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
};


