import {
	useCallback,
	useEffect,
	useState,
	type JSX,
	type MouseEvent as ReactMouseEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useFavorites } from '../../context/FavoritesContext';
import type { Event, FavoriteEvent } from '../../types';
import { EventCard } from '../shared/EventCard';
import './Favorites.css';

const mapFavoriteToEvent = (favorite: FavoriteEvent): Event => ({
	id: favorite.id,
	name: favorite.name,
	date: favorite.date,
	time: favorite.time,
	venue: favorite.venue,
	genre: favorite.genre,
	image: favorite.image,
	url: favorite.url,
});

export const Favorites = (): JSX.Element => {
	const navigate = useNavigate();
	const {
		favorites,
		loading,
		removeFavorite,
		addFavorite,
		refreshFavorites,
	} = useFavorites();
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<string>>(
		() => new Set()
	);

	useEffect(() => {
		void refreshFavorites();
	}, [refreshFavorites]);

	const updatePendingFavorite = useCallback((id: string, pending: boolean) => {
		setPendingFavoriteIds((prev) => {
			const next = new Set(prev);
			if (pending) {
				next.add(id);
			} else {
				next.delete(id);
			}
			return next;
		});
	}, []);

	const handleFavoriteToggle = useCallback(
		async (
			favorite: FavoriteEvent,
			eventPayload: Event,
			_clickEvent?: ReactMouseEvent<HTMLButtonElement>
		) => {
			if (pendingFavoriteIds.has(favorite.id)) {
				return;
			}

			updatePendingFavorite(favorite.id, true);

			try {
				const removed = await removeFavorite(favorite.id);
				toast.info(`${favorite.name} removed from favorites!`, {
					action: {
						label: 'Undo',
						onClick: async () => {
							try {
								const payload = removed
									? mapFavoriteToEvent(removed)
									: eventPayload;
								await addFavorite(payload);
								toast.success(`${favorite.name} re-added to favorites!`);
							} catch (undoError) {
								console.error('Failed to undo favorite removal:', undoError);
								toast.error('Unable to undo. Please try again.');
							}
						},
					},
				});
			} catch (error) {
				console.error('Error removing favorite:', error);
				toast.error('Unable to update favorites. Please try again.');
			} finally {
				updatePendingFavorite(favorite.id, false);
			}
		},
		[pendingFavoriteIds, updatePendingFavorite, removeFavorite, addFavorite]
	);

	const hasFavorites = favorites.length > 0;

	return (
		<div className="favorites-container">
			<div className="favorites-header">
				<h2 className="favorites-title">Favorites</h2>
			</div>

			{loading ? (
				<div className="favorites-loading" role="status" aria-live="polite">
					<span className="favorites-loader" />
					<p>Loading favorites...</p>
				</div>
			) : hasFavorites ? (
				<div className="favorites-grid" role="list">
					{favorites.map((favorite) => {
						const eventPayload = mapFavoriteToEvent(favorite);
						return (
							<EventCard
								key={favorite.id}
								event={eventPayload}
								isFavorite
								disabled={pendingFavoriteIds.has(favorite.id)}
								onFavoriteToggle={(eventToToggle, clickEvent) => {
									void handleFavoriteToggle(
										favorite,
										eventToToggle,
										clickEvent
									);
								}}
								onSelect={(selectedEvent) => {
									navigate(`/event/${selectedEvent.id}`);
								}}
							/>
						);
					})}
				</div>
			) : (
				<div className="empty-state" role="status" aria-live="polite">
					<p className="empty-state-title">No favorite events yet.</p>
					<p className="empty-state-description">
						Add events to your favorites by clicking the heart icon on any event.
					</p>
				</div>
			)}
		</div>
	);
};

