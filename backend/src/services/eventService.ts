import { SearchParams, Event } from '../types';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY || '';
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export const searchEvents = async (params: SearchParams): Promise<Event[]> => {
  try {
    const { keyword, category, location, distance } = params;
    
    const url = new URL(`${TICKETMASTER_BASE_URL}/events.json`);
    url.searchParams.append('apikey', TICKETMASTER_API_KEY);
    url.searchParams.append('keyword', keyword);
    url.searchParams.append('radius', distance.toString());
    url.searchParams.append('unit', 'miles');
    
    if (category && category !== 'All') {
      url.searchParams.append('classificationName', category);
    }

    const geoResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_API_KEY}`
    );
    const geoData = await geoResponse.json();
    
    if (geoData.results && geoData.results[0]) {
      const { lat, lng } = geoData.results[0].geometry.location;
      url.searchParams.append('latlong', `${lat},${lng}`);
    } else {
      throw new Error('Location not found');
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data._embedded && data._embedded.events) {
      return data._embedded.events.map((event: any) => ({
        id: event.id,
        name: event.name,
        date: event.dates.start.localDate,
        time: event.dates.start.localTime || '',
        venue: event._embedded?.venues?.[0]?.name || '',
        genre: event.classifications?.[0]?.segment?.name || '',
        image: event.images?.[0]?.url || '',
        url: event.url,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error in searchEvents service:', error);
    throw error;
  }
};

export const getSuggestions = async (keyword: string): Promise<string[]> => {
  try {
    const url = new URL(`${TICKETMASTER_BASE_URL}/suggest`);
    url.searchParams.append('apikey', TICKETMASTER_API_KEY);
    url.searchParams.append('keyword', keyword);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data._embedded && data._embedded.attractions) {
      return data._embedded.attractions.map((attraction: any) => attraction.name);
    }

    return [];
  } catch (error) {
    console.error('Error in getSuggestions service:', error);
    return [];
  }
};

