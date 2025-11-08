import { useEffect, useState, type JSX, type MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useFavorites } from '../../context/FavoritesContext';
import type { EventDetail as EventDetailType, Event, FavoriteEvent } from '../../types';
import { FavoriteButton } from '../shared/FavoriteButton';
import { API_BASE_URL } from '../../services/api';
import './EventDetail.css';
import { InfoTab } from './InfoTab';
import { ArtistTab } from './ArtistTab';
import { VenueTab } from './VenueTab';

const mapDetailToEvent = (detail: EventDetailType): Event => ({
  id: detail.id,
  name: detail.name,
  date: detail.date ?? '',
  time: detail.time ?? '',
  venue: detail.venue?.name ?? '',
  genre: detail.genres[0] ?? 'Miscellaneous',
  image: detail.venue?.image ?? '',
  url: detail.url ?? '',
});

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

export const EventDetail = (): JSX.Element => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const { isFavorite, addFavorite, removeFavorite } = useFavorites();
	const [eventDetail, setEventDetail] = useState<EventDetailType | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'info' | 'artist' | 'venue'>('info');
	const [favoritePending, setFavoritePending] = useState(false);

	// Fetch event details
	useEffect(() => {
		const fetchEventDetails = async () => {
			if (!id) {
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				const response = await fetch(`${API_BASE_URL}/events/${id}`);

				if (!response.ok) {
					throw new Error('Failed to fetch event details');
				}

				const data: EventDetailType = await response.json();
				setEventDetail(data);
			} catch (error) {
				console.error('Error fetching event details:', error);
				toast.error('Failed to load event details');
			} finally {
				setIsLoading(false);
			}
		};

		fetchEventDetails();
	}, [id]);

	const handleBackClick = () => {
		// Check if we came from search results
		const searchState = location.state?.searchState;
		if (searchState) {
			// Navigate back to search with preserved state
			navigate('/search', { 
				state: searchState,
				replace: false 
			});
		} else {
			// Navigate to empty search page
			navigate('/search');
		}
	};

	const handleFavoriteToggle = async (
		clickEvent: ReactMouseEvent<HTMLButtonElement>
	): Promise<void> => {
		clickEvent.preventDefault();
		clickEvent.stopPropagation();

		if (!eventDetail || !id || favoritePending) {
			return;
		}

		setFavoritePending(true);

		const payload = mapDetailToEvent(eventDetail);

		try {
			if (isFavorite(id)) {
				const removed = await removeFavorite(id);
				toast.info(`${eventDetail.name} removed from favorites!`, {
					action: {
						label: 'Undo',
						onClick: async () => {
							try {
								const undoPayload = removed
									? mapFavoriteToEvent(removed)
									: payload;
								await addFavorite(undoPayload);
								toast.success(`${eventDetail.name} re-added to favorites!`);
							} catch (undoError) {
								console.error('Failed to undo favorite removal:', undoError);
								toast.error('Unable to undo. Please try again.');
							}
						},
					},
				});
			} else {
				await addFavorite(payload);
				toast.success(`${eventDetail.name} added to favorites!`, {
					description: 'You can view it in the Favorites page.',
				});
			}
		} catch (error) {
			console.error('Error updating favorite status:', error);
			toast.error('Unable to update favorites. Please try again.');
		} finally {
			setFavoritePending(false);
		}
	};

	const isFavorited = id ? isFavorite(id) : false;

	const handleBuyTickets = () => {
		if (eventDetail?.url) {
			window.open(eventDetail.url, '_blank', 'noopener,noreferrer');
		}
	};

	if (isLoading) {
		return (
			<div className="event-detail-container">
				<div className="event-detail-loading">
					<div className="loader" />
					<p>Loading event details...</p>
				</div>
			</div>
		);
	}

	if (!eventDetail) {
		return (
			<div className="event-detail-container">
				<div className="event-detail-error">
					<p>Event not found</p>
					<button onClick={handleBackClick} className="back-button">
						← Back to Search
					</button>
				</div>
			</div>
		);
	}

	const isMusicEvent = eventDetail.genres.some(
		(genre) => genre.toLowerCase() === 'music'
	);

	return (
		<div className="event-detail-container">
			<div className="event-detail-header">
				<button onClick={handleBackClick} className="back-to-search">
					← Back to Search
				</button>
			</div>

			<div className="event-detail-title-row">
				<h1 className="event-detail-title">{eventDetail.name}</h1>
				<div className="event-detail-title-actions">
				<button
					onClick={handleBuyTickets}
					className="buy-tickets-button">
					Buy Tickets
					<svg
						width="16"
						height="16"
						viewBox="0 0 16 16"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						className="external-link-icon">
						<path
							d="M10 2H14V6"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M6 10L14 2"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M12 9V14H2V4H7"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
				<FavoriteButton
					variant="detail"
					isActive={isFavorited}
					disabled={favoritePending}
					onToggle={(clickEvent) => {
						void handleFavoriteToggle(clickEvent);
					}}
				/>
				</div>
			</div>

			<div className="event-detail-tabs">
				<button
					className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
					onClick={() => setActiveTab('info')}>
					Info
				</button>
				<button
					className={`tab-button ${activeTab === 'artist' ? 'active' : ''} ${
						!isMusicEvent ? 'disabled' : ''
					}`}
					onClick={() => isMusicEvent && setActiveTab('artist')}
					disabled={!isMusicEvent}>
					Artist
				</button>
				<button
					className={`tab-button ${activeTab === 'venue' ? 'active' : ''}`}
					onClick={() => setActiveTab('venue')}>
					Venue
				</button>
			</div>

			<div className="event-detail-content">
				{activeTab === 'info' && <InfoTab eventDetail={eventDetail} />}
				{activeTab === 'artist' && isMusicEvent && (
					<ArtistTab eventDetail={eventDetail} />
				)}
				{activeTab === 'venue' && <VenueTab eventDetail={eventDetail} />}
			</div>
		</div>
	);
};

