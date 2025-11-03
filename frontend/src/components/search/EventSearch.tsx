import { useState, useEffect, type JSX } from "react";
import "./EventSearch.css";

const SearchIcon = (): JSX.Element => (
	<svg className="btn-icon" viewBox="0 0 20 20" aria-hidden="true">
		<path
			d="M13.5 12.4a6 6 0 1 0-1.1 1.1l3.7 3.7a.8.8 0 0 0 1.1-1.1zM8.7 13a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Z"
			fill="currentColor"
		/>
	</svg>
);

export const EventSearch = (): JSX.Element => {
	const [keyword, setKeyword] = useState("");
	const [category, setCategory] = useState("All");
	const [location, setLocation] = useState("");
	const [autoDetect, setAutoDetect] = useState(false);
	const [distance, setDistance] = useState("10");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);

	useEffect(() => {
		if (autoDetect) {
			fetchUserLocation();
		}
	}, [autoDetect]);

	const fetchUserLocation = async () => {
		try {
			const response = await fetch("https://ipinfo.io/json");
			const data = await response.json();
			if (data.city && data.region) {
				setLocation(`${data.city}, ${data.region}`);
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
	};

	const handleSuggestionClick = (suggestion: string) => {
		setKeyword(suggestion);
		setShowSuggestions(false);
	};

	const handleSearch = async () => {
		if (!keyword.trim() || !location.trim()) {
			alert("Please fill in all required fields");
			return;
		}

		try {
			const API_BASE_URL =
				import.meta.env.VITE_API_URL || "http://localhost:3000/api";
			const params = new URLSearchParams({
				keyword: keyword.trim(),
				category,
				location: location.trim(),
				distance: distance.toString(),
			});

			const response = await fetch(`${API_BASE_URL}/events/search?${params}`);
			const data = await response.json();
			console.log("Search results:", data);
		} catch (error) {
			console.error("Error searching events:", error);
			alert("Error searching events. Please try again.");
		}
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
								className="form-input"
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
										onChange={(e) => setAutoDetect(e.target.checked)}
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
							onChange={(e) => setLocation(e.target.value)}
							placeholder="Enter city, district or street..."
							className="form-input"
							disabled={autoDetect}
						/>
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
								onChange={(e) => setDistance(e.target.value)}
								className="form-input distance-input"
								min="0"
							/>
							<span className="distance-unit">miles</span>
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

			<div className="empty-state">
				<div className="empty-icon">🔍</div>
				<p className="empty-message">
					Enter search criteria and click the Search button to find events.
				</p>
			</div>
		</div>
	);
};
