import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import type { EventDetail as EventDetailType } from '../../types';
import './EventDetail.css';
import { InfoTab } from './InfoTab';
import { ArtistTab } from './ArtistTab';
import { VenueTab } from './VenueTab';

export const EventDetail = (): JSX.Element => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const location = useLocation();
	const [eventDetail, setEventDetail] = useState<EventDetailType | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'info' | 'artist' | 'venue'>('info');
	const [isFavorited, setIsFavorited] = useState(false);

	// Check if event is favorited
	useEffect(() => {
		if (id) {
			const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
			setIsFavorited(favorites.some((fav: { id: string }) => fav.id === id));
		}
	}, [id]);

	// Fetch event details
	useEffect(() => {
		const fetchEventDetails = async () => {
			if (!id) {
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				const API_BASE_URL =
					import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
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

	const handleFavoriteClick = () => {
		if (!eventDetail || !id) return;

		const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

		if (isFavorited) {
			// Remove from favorites
			const updatedFavorites = favorites.filter(
				(fav: { id: string }) => fav.id !== id
			);
			localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
			setIsFavorited(false);
			toast.info(`${eventDetail.name} removed from favorites!`, {
				action: {
					label: 'Undo',
					onClick: () => {
						localStorage.setItem('favorites', JSON.stringify(favorites));
						setIsFavorited(true);
					},
				},
			});
		} else {
			// Add to favorites
			const eventCard = {
				id: eventDetail.id,
				name: eventDetail.name,
				date: eventDetail.date,
				time: eventDetail.time,
				venue: eventDetail.venue?.name || '',
				genre: eventDetail.genres[0] || 'Miscellaneous',
				image: eventDetail.venue?.image || '',
				url: eventDetail.url,
			};
			favorites.push(eventCard);
			localStorage.setItem('favorites', JSON.stringify(favorites));
			setIsFavorited(true);
			toast.success(`${eventDetail.name} added to favorites!`, {
				description: 'You can view it in the Favorites page.',
			});
		}
	};

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
			<Toaster position="top-right" />
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
					<button
						onClick={handleFavoriteClick}
						className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
						aria-label="Favorite"
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

