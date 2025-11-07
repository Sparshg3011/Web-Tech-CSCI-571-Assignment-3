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
    console.error('Error fetching event details for ID:', req.params.id);
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSpotifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      res.status(500).json({ error: 'Spotify credentials not configured' });
      return;
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify token');
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    res.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSpotifyArtistDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Artist name is required' });
      return;
    }

    console.log('Fetching Spotify artist for:', name);
    const data = await eventService.getSpotifyArtist(name);
    console.log('Spotify artist data received');

    if (!data.artist) {
      res.status(404).json({ error: 'Artist not found on Spotify' });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching Spotify artist details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

