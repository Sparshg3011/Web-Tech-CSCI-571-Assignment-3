import type { JSX } from 'react';
import type { EventDetail } from '../../types';
import './VenueTab.css';

interface VenueTabProps {
	eventDetail: EventDetail;
}

export const VenueTab = ({ eventDetail }: VenueTabProps): JSX.Element => {
	const venue = eventDetail.venue;

	if (!venue) {
		return (
			<div className="venue-tab-container">
				<div className="venue-tab-error">
					<p>No venue information available</p>
				</div>
			</div>
		);
	}

	const handleAddressClick = () => {
		if (venue.location?.latitude && venue.location?.longitude) {
			const url = `https://www.google.com/maps?q=${venue.location.latitude},${venue.location.longitude}`;
			window.open(url, '_blank', 'noopener,noreferrer');
		}
	};

	const handleSeeEvents = () => {
		if (venue.url) {
			window.open(venue.url, '_blank', 'noopener,noreferrer');
		}
	};

	return (
		<div className="venue-tab-container">
			<div className="venue-header">
				<div className="venue-header-left">
					<h2 className="venue-name">{venue.name}</h2>
					{venue.address && (
						<button
							onClick={handleAddressClick}
							className="venue-address-link">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2">
								<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
								<circle cx="12" cy="10" r="3" />
							</svg>
							{venue.address}
						</button>
					)}
				</div>
				{venue.url && (
					<button onClick={handleSeeEvents} className="see-events-button">
						See Events
					</button>
				)}
			</div>

			{venue.image && (
				<div className="venue-image-container">
					<img src={venue.image} alt={venue.name} className="venue-image" />
				</div>
			)}

			<div className="venue-info-section">
				{venue.parkingDetail && (
					<div className="venue-info-item">
						<h3 className="venue-info-title">Parking</h3>
						<p className="venue-info-content">{venue.parkingDetail}</p>
					</div>
				)}

				{venue.generalRule && (
					<div className="venue-info-item">
						<h3 className="venue-info-title">General Rule</h3>
						<p className="venue-info-content">{venue.generalRule}</p>
					</div>
				)}

				{venue.childRule && (
					<div className="venue-info-item">
						<h3 className="venue-info-title">Child Rule</h3>
						<p className="venue-info-content">{venue.childRule}</p>
					</div>
				)}
			</div>
		</div>
	);
};

