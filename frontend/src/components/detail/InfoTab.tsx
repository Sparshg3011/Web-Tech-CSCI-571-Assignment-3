import type { JSX } from 'react';
import type { EventDetail } from '../../types';
import './InfoTab.css';

interface InfoTabProps {
	eventDetail: EventDetail;
}

const formatDate = (date: string, time: string): string => {
	if (!date) return 'Date TBD';
	
	const dateObj = new Date(`${date}T${time || '00:00:00'}`);
	if (isNaN(dateObj.getTime())) return 'Date TBD';

	const formattedDate = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(dateObj);

	if (time) {
		const formattedTime = new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true,
		}).format(dateObj);
		return `${formattedDate}, ${formattedTime}`;
	}

	return formattedDate;
};

const getTicketStatusColor = (status: string): string => {
	const statusLower = status.toLowerCase();
	if (statusLower.includes('onsale')) return 'green';
	if (statusLower.includes('offsale')) return 'red';
	if (statusLower.includes('canceled')) return 'black';
	if (statusLower.includes('postponed') || statusLower.includes('rescheduled'))
		return 'orange';
	return 'gray';
};

const getTicketStatusText = (status: string): string => {
	const statusLower = status.toLowerCase();
	if (statusLower.includes('onsale')) return 'On Sale';
	if (statusLower.includes('offsale')) return 'Off Sale';
	if (statusLower.includes('canceled')) return 'Canceled';
	if (statusLower.includes('postponed')) return 'Postponed';
	if (statusLower.includes('rescheduled')) return 'Rescheduled';
	return status;
};

const formatPriceRange = (
	priceRanges: Array<{ type?: string; currency?: string; min?: number; max?: number }>
): string => {
	if (!priceRanges || priceRanges.length === 0) return '';

	const ranges = priceRanges
		.map((range) => {
			const currency = range.currency || 'USD';
			const min = range.min ?? 0;
			const max = range.max ?? 0;

			if (min > 0 && max > 0) {
				return `${currency} ${min} - ${currency} ${max}`;
			} else if (min > 0) {
				return `From ${currency} ${min}`;
			}
			return '';
		})
		.filter(Boolean);

	return ranges.join(', ');
};

export const InfoTab = ({ eventDetail }: InfoTabProps): JSX.Element => {
	const handleFacebookShare = () => {
		if (eventDetail.url) {
			const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
				eventDetail.url
			)}`;
			window.open(facebookUrl, '_blank', 'noopener,noreferrer');
		}
	};

	const handleTwitterShare = () => {
		if (eventDetail.url) {
			const text = `Check ${eventDetail.name} on Ticketmaster`;
			const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
				text
			)}&url=${encodeURIComponent(eventDetail.url)}`;
			window.open(twitterUrl, '_blank', 'noopener,noreferrer');
		}
	};

	return (
		<div className="info-tab-container">
			<div className="info-tab-content">
				<div className="info-details-card">
					<div className="info-rows">
						{eventDetail.date && (
							<div className="info-row">
								<span className="info-row-label">Date</span>
								<span className="info-row-value">
									{formatDate(eventDetail.date, eventDetail.time)}
								</span>
							</div>
						)}
						{eventDetail.artists && eventDetail.artists.length > 0 && (
							<div className="info-row">
								<span className="info-row-label">Artists/Team</span>
								<span className="info-row-value">
									{eventDetail.artists.map((a) => a.name).join(', ')}
								</span>
							</div>
						)}
						{eventDetail.venue?.name && (
							<div className="info-row">
								<span className="info-row-label">Venue</span>
								<span className="info-row-value">{eventDetail.venue.name}</span>
							</div>
						)}
						{eventDetail.genres && eventDetail.genres.length > 0 && (
							<div className="info-row">
								<span className="info-row-label">Genres</span>
								<span className="info-row-value">
									{eventDetail.genres.join(', ')}
								</span>
							</div>
						)}
						{eventDetail.priceRanges &&
								eventDetail.priceRanges.length > 0 && (
							<div className="info-row">
								<span className="info-row-label">Price Ranges</span>
								<span className="info-row-value">
									{formatPriceRange(eventDetail.priceRanges)}
								</span>
							</div>
						)}
						{eventDetail.status && (
							<div className="info-row">
								<span className="info-row-label">Ticket Status</span>
								<span className="info-row-value">
									<span
										className={`ticket-status ${getTicketStatusColor(
											eventDetail.status
										)}`}>
										{getTicketStatusText(eventDetail.status)}
									</span>
								</span>
							</div>
						)}
						<div className="info-row share-row">
							<span className="info-row-label">Share</span>
							<div className="share-buttons">
								<button
									onClick={handleFacebookShare}
									className="share-button facebook"
									aria-label="Share on Facebook">
									<svg
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round">
										<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
									</svg>
								</button>
								<button
									onClick={handleTwitterShare}
									className="share-button twitter"
									aria-label="Share on Twitter">
									<svg
										width="20"
										height="20"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round">
										<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>

				{eventDetail.seatmapUrl && (
					<div className="seatmap-wrapper">
						<h3 className="seatmap-title">Seatmap</h3>
						<div className="seatmap-section">
							<img
								src={eventDetail.seatmapUrl}
								alt="Seat map"
								className="seatmap-image"
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

