export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  genre: string;
  image: string;
  url: string;
}

export interface EventDetail {
  id: string;
  name: string;
  url: string;
  date: string;
  time: string;
  status: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    location?: {
      latitude?: string;
      longitude?: string;
    };
    url?: string;
    image?: string;
    parkingDetail?: string;
    generalRule?: string;
    childRule?: string;
  } | null;
  genres: string[];
  artists: Array<{
    name: string;
    url?: string;
    twitter?: string;
    facebook?: string;
    image?: string;
  }>;
  priceRanges: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  seatmapUrl?: string;
}

export interface SearchParams {
  keyword: string;
  category: string;
  location: string;
  distance: number;
}

export interface SpotifyArtistInfo {
  id: string;
  name: string;
  followers: number;
  popularity: number;
  genres: string[];
  spotifyUrl?: string;
  image?: string;
}

export interface SpotifyAlbumInfo {
  id: string;
  name: string;
  releaseDate?: string;
  totalTracks?: number;
  spotifyUrl?: string;
  image?: string;
}

export interface SpotifyArtistResponse {
  artist: SpotifyArtistInfo | null;
  albums: SpotifyAlbumInfo[];
}
