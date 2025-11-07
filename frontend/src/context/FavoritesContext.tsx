import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type JSX,
} from 'react';
import { api } from '../services/api';
import type { Event, FavoriteEvent } from '../types';

type FavoritePayload = Event;

type FavoritesContextValue = {
  favorites: FavoriteEvent[];
  loading: boolean;
  isFavorite: (id: string | undefined) => boolean;
  getFavorite: (id: string | undefined) => FavoriteEvent | undefined;
  addFavorite: (event: FavoritePayload) => Promise<FavoriteEvent>;
  removeFavorite: (id: string) => Promise<FavoriteEvent | null>;
  refreshFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

const transformEventPayload = (event: FavoritePayload) => ({
  id: event.id,
  name: event.name ?? '',
  date: event.date ?? '',
  time: event.time ?? '',
  venue: event.venue ?? '',
  genre: event.genre ?? '',
  image: event.image ?? '',
  url: event.url ?? '',
});

const sortFavorites = (items: FavoriteEvent[]): FavoriteEvent[] =>
  items
    .slice()
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

export const FavoritesProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<FavoriteEvent[]>('/favorites');
      setFavorites(sortFavorites(data));
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshFavorites();
  }, [refreshFavorites]);

  const addFavorite = useCallback(async (event: FavoritePayload) => {
    const favorite = await api.post<FavoriteEvent>('/favorites', transformEventPayload(event));
    setFavorites((prev) => {
      const withoutDuplicate = prev.filter((item) => item.id !== favorite.id);
      return sortFavorites([...withoutDuplicate, favorite]);
    });
    return favorite;
  }, []);

  const removeFavorite = useCallback(async (id: string) => {
    const response = await api.delete<{ removed: FavoriteEvent | null }>(`/favorites/${encodeURIComponent(id)}`);
    const removed = response?.removed ?? null;
    setFavorites((prev) => prev.filter((item) => item.id !== id));
    return removed;
  }, []);

  const isFavorite = useCallback(
    (id: string | undefined) => favorites.some((favorite) => favorite.id === id),
    [favorites]
  );

  const getFavorite = useCallback(
    (id: string | undefined) => favorites.find((favorite) => favorite.id === id),
    [favorites]
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      loading,
      isFavorite,
      getFavorite,
      addFavorite,
      removeFavorite,
      refreshFavorites,
    }),
    [favorites, loading, isFavorite, getFavorite, addFavorite, removeFavorite, refreshFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextValue => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};


