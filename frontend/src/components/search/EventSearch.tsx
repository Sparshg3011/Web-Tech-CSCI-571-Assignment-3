import { useState, useEffect, type JSX } from "react";
import type { Event } from "../../types";
import "./EventSearch.css";

const SearchIcon = (): JSX.Element => (
	<svg className="btn-icon" viewBox="0 0 20 20" aria-hidden="true">
		<path
			d="M13.5 12.4a6 6 0 1 0-1.1 1.1l3.7 3.7a.8.8 0 0 0 1.1-1.1zM8.7 13a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Z"
			fill="currentColor"
		/>
	</svg>
);

type FormErrors = {
	keyword?: string;
	location?: string;
	distance?: string;
};

export const EventSearch = (): JSX.Element => {
	const [keyword, setKeyword] = useState("");
	const [category, setCategory] = useState("All");
	const [location, setLocation] = useState("");
	const [autoDetect, setAutoDetect] = useState(false);
	const [distance, setDistance] = useState("10");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [results, setResults] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);

	const clearError = (field: keyof FormErrors) => {
		setErrors((prev) => {
			if (!prev[field]) {
				return prev;
			}
			const { [field]: _removed, ...rest } = prev;
			return rest;
		});
	};

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		if (!keyword.trim()) {
			newErrors.keyword = "Please enter some keywords.";
		}

		if (!autoDetect && !location.trim()) {
			newErrors.location = "Location is required when auto-detect is disabled.";
		}

		const distanceValue = Number(distance);
		if (!distance.trim() || Number.isNaN(distanceValue) || distanceValue <= 0) {
			newErrors.distance = "Please enter a distance greater than 0.";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	useEffect(() => {
		if (autoDetect) {
			fetchUserLocation();
		}
	}, [autoDetect]);

	const fetchUserLocation = async () => {
		try {
			const IPINFO_TOKEN = "f0b684f9b41094";
			const response = await fetch(
				`https://ipinfo.io/json?token=${IPINFO_TOKEN}`
			);
			const data = await response.json();
			if (data.city && data.region) {
				setLocation(`${data.city}, ${data.region}`);
				clearError("location");
			}
		} catch (error) {
			console.error("Error fetching location:", error);
		}
	};

	const fetchSuggestions = async (value: string) => {
		if (value.length < 2) {
			setSuggestions([]);
			return;
		}

		try {
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "http://localhost:3000/api";
			const response = await fetch(
				`${API_BASE_URL}/events/suggestions?keyword=${encodeURIComponent(
					value
				)}`
			);
			const data = await response.json();
			setSuggestions(data.suggestions || []);
		} catch (error) {
			console.error("Error fetching suggestions:", error);
		}
	};

	const handleKeywordChange = (value: string) => {
		setKeyword(value);
		fetchSuggestions(value);
		setShowSuggestions(true);
		if (value.trim()) {
			clearError("keyword");
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		setKeyword(suggestion);
		setShowSuggestions(false);
		clearError("keyword");
	};

	const handleLocationChange = (value: string) => {
		setLocation(value);
		if (value.trim()) {
			clearError("location");
		}
	};

	const handleDistanceChange = (value: string) => {
		setDistance(value);
		const numericValue = Number(value);
		if (value.trim() && !Number.isNaN(numericValue) && numericValue > 0) {
			clearError("distance");
		}
	};

	const fallbackImage = "https://via.placeholder.com/400x250?text=No+Image";

	const formatCardDate = (event: Event): string => {
		if (!event.date) {
			return "Date TBD";
		}
		const base = `${event.date}T${event.time || "00:00:00"}`;
		const date = new Date(base);
		if (Number.isNaN(date.getTime())) {
			return "Date TBD";
		}
		return new Intl.DateTimeFormat("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		}).format(date);
	};

	const geocodeLocation = async (
		locationStr: string
	): Promise<{ lat: number; lng: number } | null> => {
		try {
			const GOOGLE_API_KEY =
				import.meta.env.VITE_GOOGLE_API_KEY ||
				"AIzaSyDxim2lRaUCInmHiz-gN-jmPPgc030Bdyg";
			const response = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
					locationStr
				)}&key=${GOOGLE_API_KEY}`
			);
			const data = await response.json();

			if (data.results && data.results[0]) {
				const { lat, lng } = data.results[0].geometry.location;
				return { lat, lng };
			}
			return null;
		} catch (error) {
			console.error("Error geocoding location:", error);
			return null;
		}
	};

	const handleSearch = async () => {
		if (!validateForm()) {
			setShowSuggestions(false);
			return;
		}

		setShowSuggestions(false);
		setIsLoading(true);
		setErrorMessage(null);
		setHasSearched(true);
		setResults([]);

		try {
			// Geocode the location first
			const coords = await geocodeLocation(location.trim());
			if (!coords) {
				setErrorMessage(
					"Unable to find the specified location. Please try again."
				);
				setIsLoading(false);
				return;
			}

			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "http://localhost:3000/api";
			const params = new URLSearchParams({
				keyword: keyword.trim(),
				category,
				lat: coords.lat.toString(),
				lng: coords.lng.toString(),
				distance: distance.trim(),
			});

			const response = await fetch(`${API_BASE_URL}/events/search?${params}`);
			if (!response.ok) {
				throw new Error("Unable to fetch events. Please try again.");
			}
			const data: Event[] = await response.json();
			const sorted = data
				.filter((event): event is Event => Boolean(event && event.id))
				.sort((a, b) => {
					const aDate = new Date(`${a.date ?? ""}T${a.time ?? "00:00:00"}`);
					const bDate = new Date(`${b.date ?? ""}T${b.time ?? "00:00:00"}`);
					return aDate.getTime() - bDate.getTime();
				})
				.slice(0, 20);
			setResults(sorted);
		} catch (error) {
			console.error("Error searching events:", error);
			setErrorMessage(
				error instanceof Error
					? error.message
					: "Error searching events. Please try again."
			);
		}
		setIsLoading(false);
	};

	return (
		<div className="event-search-container">
			<div className="search-form">
				<div className="form-row">
					{/* Keywords */}
					<div className="form-group">
						<label htmlFor="keyword">
							Keywords <span className="required">*</span>
						</label>
						<div className="autocomplete-wrapper">
							<input
								id="keyword"
								type="text"
								value={keyword}
								onChange={(e) => handleKeywordChange(e.target.value)}
								onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
								onFocus={() => keyword && setShowSuggestions(true)}
								placeholder="Search for events..."
								className={`form-input${errors.keyword ? " error" : ""}`}
								aria-invalid={Boolean(errors.keyword)}
								aria-describedby={errors.keyword ? "keyword-error" : undefined}
								autoComplete="off"
							/>
							{showSuggestions && suggestions.length > 0 && (
								<ul className="suggestions-list" role="listbox">
									{suggestions.map((suggestion, index) => (
										<li
											key={index}
											onClick={() => handleSuggestionClick(suggestion)}
											className="suggestion-item"
											role="option">
											{suggestion}
										</li>
									))}
								</ul>
							)}
						</div>
						<div className="error-container">
							{errors.keyword && (
								<p id="keyword-error" className="error-message">
									{errors.keyword}
								</p>
							)}
						</div>
					</div>

					{/* Category */}
					<div className="form-group">
						<label htmlFor="category">
							Category <span className="required">*</span>
						</label>
						<select
							id="category"
							value={category}
							onChange={(e) => setCategory(e.target.value)}
							className="form-select">
							<option value="All">All</option>
							<option value="Music">Music</option>
							<option value="Sports">Sports</option>
							<option value="Arts & Theatre">Arts & Theatre</option>
							<option value="Film">Film</option>
							<option value="Miscellaneous">Miscellaneous</option>
						</select>
					</div>

					{/* Location */}
					<div className="form-group location-group">
						<div className="location-header">
							<label htmlFor="location">
								Location <span className="required">*</span>
							</label>
							<div className="auto-detect-row">
								<span className="auto-detect-label">Auto-detect Location</span>
								<label className="switch">
									<input
										id="auto-detect"
										type="checkbox"
										checked={autoDetect}
										onChange={(e) => {
											const isChecked = e.target.checked;
											setAutoDetect(isChecked);
											if (isChecked) {
												clearError("location");
											}
										}}
										className="switch-input"
										aria-label="Auto-detect location"
									/>
									<span className="slider" />
								</label>
							</div>
						</div>
						<input
							id="location"
							type="text"
							value={location}
							onChange={(e) => handleLocationChange(e.target.value)}
							placeholder="Enter city, district or street..."
							className={`form-input${errors.location ? " error" : ""}`}
							aria-invalid={Boolean(errors.location)}
							aria-describedby={errors.location ? "location-error" : undefined}
							disabled={autoDetect}
						/>
						<div className="error-container">
							{errors.location && !autoDetect && (
								<p id="location-error" className="error-message">
									{errors.location}
								</p>
							)}
						</div>
					</div>

					{/* Distance */}
					<div className="form-group distance-group">
						<label htmlFor="distance">
							Distance <span className="required">*</span>
						</label>
						<div className="distance-input-wrapper">
							<input
								id="distance"
								type="number"
								value={distance}
								onChange={(e) => handleDistanceChange(e.target.value)}
								className={`form-input distance-input${
									errors.distance ? " error" : ""
								}`}
								aria-invalid={Boolean(errors.distance)}
								aria-describedby={
									errors.distance ? "distance-error" : undefined
								}
								min="0"
							/>
							<span className="distance-unit">miles</span>
						</div>
						<div className="error-container">
							{errors.distance && (
								<p id="distance-error" className="error-message">
									{errors.distance}
								</p>
							)}
						</div>
					</div>

					{/* Button */}
					<div className="form-actions">
						<button
							type="button"
							onClick={handleSearch}
							className="btn btn-search">
							<SearchIcon />
							<span>Search Events</span>
						</button>
					</div>
				</div>
			</div>

			<div className="results-section">
				{!hasSearched && !isLoading ? (
					<div className="empty-state">
						<div className="empty-icon">🔍</div>
						<p className="empty-message">
							Enter search criteria and click the Search button to find events.
						</p>
					</div>
				) : null}

				{isLoading ? (
					<div className="results-loading" role="status" aria-live="polite">
						<span className="loader" />
						<p>Searching events...</p>
					</div>
				) : null}

				{!isLoading && errorMessage ? (
					<div className="results-message error" role="alert">
						{errorMessage}
					</div>
				) : null}

				{!isLoading && !errorMessage && results.length > 0 ? (
					<div className="results-grid" role="list">
						{results.map((event) => (
							<div
								key={event.id}
								className="result-card"
								role="listitem"
								onClick={() => {
									if (event.url) {
										window.open(event.url, "_blank", "noopener,noreferrer");
									}
								}}>
								<div className="result-card-image">
									<img
										src={event.image || fallbackImage}
										alt={event.name}
										loading="lazy"
									/>
									<div className="result-card-overlay">
										<span className="result-card-badge">
											{event.genre || "Miscellaneous"}
										</span>
										<span className="result-card-date">
											{formatCardDate(event)}
										</span>
									</div>
								</div>
								<div className="result-card-body">
									<div className="result-card-body-content">
										<h3 className="result-card-title">{event.name}</h3>
										<p className="result-card-venue">
											{event.venue || "Venue TBD"}
										</p>
									</div>
									<div className="result-card-footer">
										<span className="result-card-heart" aria-hidden="true">
											♡
										</span>
									</div>
								</div>
							</div>
						))}
					</div>
				) : null}

				{!isLoading && !errorMessage && hasSearched && results.length === 0 ? (
					<div className="results-message empty" role="status">
						<div className="empty-icon">🗂️</div>
						<p className="empty-message">No results available.</p>
					</div>
				) : null}
			</div>
		</div>
	);
};
