import { Request, Response } from 'express';
import * as eventService from '../services/eventService';

export const searchEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, category, lat, lng, distance } = req.query;
    
    if (!keyword || !lat || !lng) {
      res.status(400).json({ error: 'Keyword, lat, and lng are required' });
      return;
    }

    const events = await eventService.searchEvents({
      keyword: keyword as string,
      category: category as string || 'All',
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string),
      distance: distance ? parseInt(distance as string) : 10,
    });

    res.json(events);
  } catch (error) {
    console.error('Error searching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      res.status(400).json({ error: 'Keyword is required' });
      return;
    }

    const suggestions = await eventService.getSuggestions(keyword as string);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Event id is required' });
      return;
    }

    const detail = await eventService.getEventDetails(id as string);
    res.json(detail);
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

