import dotenv from 'dotenv';
import {
  SearchParams,
  Event,
  EventDetail,
  SpotifyArtistResponse,
  SpotifyAlbumInfo,
  SpotifyArtistInfo,
} from '../types';

dotenv.config();

const rawTicketmasterKey =
  process.env.TM_API_KEY || process.env.TICKETMASTER_API_KEY || '';
const TICKETMASTER_API_KEY = rawTicketmasterKey.replace(/^['"]|['"]$/g, '').trim();
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

const rawSpotifyClientId = process.env.SPOTIFY_CLIENT_ID || '';
const rawSpotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_CLIENT_ID = rawSpotifyClientId.replace(/^['"]|['"]$/g, '').trim();
const SPOTIFY_CLIENT_SECRET = rawSpotifyClientSecret.replace(/^['"]|['"]$/g, '').trim();

type SpotifyTokenCache = {
  token: string;
  expiresAt: number;
};

const spotifyTokenCache: SpotifyTokenCache = {
  token: '',
  expiresAt: 0,
};

const createTicketmasterUrl = (
  path: string,
  params: Record<string, string>
): string => {
  const url = new URL(`${TICKETMASTER_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};

const getSpotifyAccessToken = async (): Promise<string> => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials are missing');
  }

  const now = Date.now();
  if (spotifyTokenCache.token && now < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token;
  }

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error(`Spotify token error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };

  spotifyTokenCache.token = data.access_token;
  spotifyTokenCache.expiresAt = now + Math.max((data.expires_in - 60) * 1000, 0);

  return spotifyTokenCache.token;
};

const normaliseAlbumList = (items: Array<any> = []): SpotifyAlbumInfo[] => {
  const seen = new Map<string, SpotifyAlbumInfo>();

  items.forEach((album) => {
    if (!album || !album.name) {
      return;
    }

    const key = album.name.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    const cover = album.images?.[0]?.url;

    seen.set(key, {
      id: album.id ?? '',
      name: album.name ?? '',
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      spotifyUrl: album.external_urls?.spotify,
      image: cover,
    });
  });

  return Array.from(seen.values());
};

export const getSpotifyArtist = async (name: string): Promise<SpotifyArtistResponse> => {
  if (!name || !name.trim()) {
    return { artist: null, albums: [] };
  }

  const token = await getSpotifyAccessToken();
  const searchResponse = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchResponse.ok) {
    throw new Error(`Spotify search error: ${searchResponse.status} ${searchResponse.statusText}`);
  }

  type SpotifySearchResponse = {
    artists?: {
      items?: Array<{
        id?: string;
        name?: string;
        followers?: { total?: number };
        popularity?: number;
        genres?: string[];
        external_urls?: { spotify?: string };
        images?: Array<{ url?: string }>;
      }>;
    };
  };

  const searchData = (await searchResponse.json()) as SpotifySearchResponse;
  const artistRaw = searchData.artists?.items?.[0];

  if (!artistRaw || !artistRaw.id) {
    return { artist: null, albums: [] };
  }

  const artistImage = artistRaw.images?.[0]?.url;

  const artist: SpotifyArtistInfo = {
    id: artistRaw.id,
    name: artistRaw.name ?? '',
    followers: artistRaw.followers?.total ?? 0,
    popularity: artistRaw.popularity ?? 0,
    genres: artistRaw.genres ?? [],
    spotifyUrl: artistRaw.external_urls?.spotify,
    image: artistImage,
  };

  const albumsResponse = await fetch(
    `https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&limit=24&market=US`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  let albums: SpotifyAlbumInfo[] = [];
  if (albumsResponse.ok) {
    const albumsData = (await albumsResponse.json()) as { items?: Array<any> };
    albums = normaliseAlbumList(albumsData.items).slice(0, 8);
  }

  return { artist, albums };
};

type TicketmasterEventsResponse = {
  _embedded?: {
    events?: Array<{
      id?: string;
      name?: string;
      dates?: {
        start?: {
          localDate?: string;
          localTime?: string;
        };
      };
      _embedded?: {
        venues?: Array<{ name?: string }>;
      };
      classifications?: Array<{
        segment?: {
          name?: string;
        };
      }>;
      images?: Array<{ url?: string }>;
      url?: string;
    }>;
  };
};

type TicketmasterSuggestResponse = {
  _embedded?: {
    attractions?: Array<{ name?: string }>;
    venues?: Array<{ name?: string }>;
    events?: Array<{ name?: string }>;
  };
};

type TicketmasterEventDetailResponse = {
  id?: string;
  name?: string;
  url?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
    status?: {
      code?: string;
    };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
    type?: { name?: string };
    subType?: { name?: string };
  }>;
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      address?: { line1?: string };
      city?: { name?: string };
      state?: { name?: string };
      country?: { name?: string };
      postalCode?: string;
      url?: string;
      location?: { latitude?: string; longitude?: string };
      images?: Array<{ url?: string }>;
      generalInfo?: {
        generalRule?: string;
        childRule?: string;
        parkingDetail?: string;
      };
    }>;
    attractions?: Array<{
      name?: string;
      url?: string;
      externalLinks?: {
        twitter?: Array<{ url?: string }>;
        facebook?: Array<{ url?: string }>;
      };
      images?: Array<{ url?: string }>;
    }>;
  };
  seatmap?: {
    staticUrl?: string;
  };
  images?: Array<{ url?: string }>;
};

export const searchEvents = async (params: SearchParams): Promise<Event[]> => {
  try {
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key is missing');
    }

    const { keyword, category, lat, lng, distance } = params;
    const query: Record<string, string> = {
      apikey: TICKETMASTER_API_KEY,
      keyword,
      radius: distance.toString(),
      unit: 'miles',
      latlong: `${lat},${lng}`,
    };

    if (category && category !== 'All') {
      query.classificationName = category;
    }

    const response = await fetch(createTicketmasterUrl('/events.json', query));

    if (!response.ok) {
      throw new Error(`Ticketmaster events API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TicketmasterEventsResponse;

    if (data._embedded && data._embedded.events) {
      return data._embedded.events.map((event) => ({
        id: event.id ?? '',
        name: event.name ?? '',
        date: event.dates?.start?.localDate ?? '',
        time: event.dates?.start?.localTime ?? '',
        venue: event._embedded?.venues?.[0]?.name ?? '',
        genre: event.classifications?.[0]?.segment?.name ?? '',
        image: event.images?.[0]?.url ?? '',
        url: event.url ?? '',
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
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key is missing');
    }

    const response = await fetch(
      createTicketmasterUrl('/suggest', {
        apikey: TICKETMASTER_API_KEY,
        keyword,
      })
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster suggest API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TicketmasterSuggestResponse;

    const suggestions = new Set<string>();
    const addSuggestion = (value?: string) => {
      if (value && value.trim()) {
        suggestions.add(value.trim());
      }
    };

    data._embedded?.attractions?.forEach((attraction) => {
      addSuggestion(attraction?.name);
    });

    data._embedded?.venues?.forEach((venue) => {
      addSuggestion(venue?.name);
    });

    data._embedded?.events?.forEach((event) => {
      addSuggestion(event?.name);
    });

    return Array.from(suggestions).slice(0, 10);
  } catch (error) {
    console.error('Error in getSuggestions service:', error);
    throw error;
  }
};

const extractGenres = (
  classifications?: TicketmasterEventDetailResponse['classifications']
): string[] => {
  if (!classifications || classifications.length === 0) {
    return [];
  }

  const primary = classifications[0] ?? {};
  const ordered = [
    primary.segment?.name,
    primary.genre?.name,
    primary.subGenre?.name,
    primary.type?.name,
    primary.subType?.name,
  ];

  return Array.from(new Set(ordered.filter(Boolean))) as string[];
};

const getVenueInfo = (
  venues?: TicketmasterEventDetailResponse['_embedded'] extends infer E
    ? E extends { venues?: Array<any> }
      ? E['venues']
      : never
    : never
): EventDetail['venue'] => {
  if (!venues || venues.length === 0) {
    return null;
  }

  const venue = venues[0] ?? {};
  const address = [
    venue.address?.line1,
    venue.city?.name,
    venue.state?.name,
    venue.postalCode,
    venue.country?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    name: venue.name ?? '',
    address,
    city: venue.city?.name ?? '',
    state: venue.state?.name ?? '',
    postalCode: venue.postalCode ?? '',
    country: venue.country?.name ?? '',
    url: venue.url,
    location: venue.location,
    image: venue.images?.find((img) => Boolean(img?.url))?.url,
    generalRule: venue.generalInfo?.generalRule,
    childRule: venue.generalInfo?.childRule,
    parkingDetail: venue.generalInfo?.parkingDetail,
  };
};

const mapArtists = (
  attractions?: TicketmasterEventDetailResponse['_embedded'] extends infer E
    ? E extends { attractions?: Array<any> }
      ? E['attractions']
      : never
    : never
): EventDetail['artists'] => {
  if (!attractions) {
    return [];
  }

  return attractions
    .filter((artist) => Boolean(artist?.name))
    .map((artist) => ({
      name: artist?.name ?? '',
      url: artist?.url,
      twitter: artist?.externalLinks?.twitter?.[0]?.url,
      facebook: artist?.externalLinks?.facebook?.[0]?.url,
      image: artist?.images?.find((img) => Boolean(img?.url))?.url,
    }));
};

export const getEventDetails = async (id: string): Promise<EventDetail> => {
  try {
    if (!TICKETMASTER_API_KEY) {
      throw new Error('Ticketmaster API key is missing');
    }

    const response = await fetch(
      createTicketmasterUrl(`/events/${id}`, {
        apikey: TICKETMASTER_API_KEY,
      })
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster event detail error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as TicketmasterEventDetailResponse;
    if (!data || !data.id) {
      throw new Error('Event not found');
    }

    const detail: EventDetail = {
      id: data.id ?? '',
      name: data.name ?? '',
      url: data.url ?? '',
      date: data.dates?.start?.localDate ?? '',
      time: data.dates?.start?.localTime ?? '',
      status: data.dates?.status?.code ?? '',
      venue: getVenueInfo(data._embedded?.venues),
      genres: extractGenres(data.classifications),
      artists: mapArtists(data._embedded?.attractions),
      priceRanges: data.priceRanges ?? [],
      seatmapUrl: data.seatmap?.staticUrl,
    };

    return detail;
  } catch (error) {
    console.error('Error in getEventDetails service:', error);
    throw error;
  }
};
