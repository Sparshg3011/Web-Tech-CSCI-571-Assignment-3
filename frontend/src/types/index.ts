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

export interface SearchParams {
  keyword: string;
  category: string;
  location: string;
  distance: number;
}
