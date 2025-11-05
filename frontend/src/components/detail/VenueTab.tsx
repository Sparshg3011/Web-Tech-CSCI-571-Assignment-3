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

	const formatContentWithLinks = (text: string): JSX.Element => {
		const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
		const parts = text.split(urlRegex);
		return (
			<>
				{parts.map((part, index) => {
					if (part.match(urlRegex)) {
						const url = part.startsWith('http') ? part : `https://${part}`;
						return (
							<a
								key={index}
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								className="venue-link">
								{part}
							</a>
						);
					}
					return <span key={index}>{part}</span>;
				})}
			</>
		);
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
							{venue.address}
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
					)}
				</div>
				{venue.url && (
					<button onClick={handleSeeEvents} className="see-events-button">
						See Events
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
				)}
			</div>

			<div className="venue-content">
				{venue.image && (
					<div className="venue-logo-container">
						<img src={venue.image} alt={venue.name} className="venue-logo" />
					</div>
				)}

				<div className="venue-info-section">
					{venue.parkingDetail && venue.parkingDetail.trim().length > 0 ? (
						<div className="venue-info-item">
							<h3 className="venue-info-title">Parking</h3>
							<p className="venue-info-content">
								{formatContentWithLinks(venue.parkingDetail)}
							</p>
						</div>
					) : null}

					{venue.generalRule && venue.generalRule.trim().length > 0 ? (
						<div className="venue-info-item">
							<h3 className="venue-info-title">General Rule</h3>
							<p className="venue-info-content">
								{formatContentWithLinks(venue.generalRule)}
							</p>
						</div>
					) : null}

					{venue.childRule && venue.childRule.trim().length > 0 ? (
						<div className="venue-info-item">
							<h3 className="venue-info-title">Child Rule</h3>
							<p className="venue-info-content">
								{formatContentWithLinks(venue.childRule)}
							</p>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
};

