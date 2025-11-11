import {
	useState,
	useEffect,
	useCallback,
	useRef,
	type JSX,
	type MouseEvent as ReactMouseEvent,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { Event, FavoriteEvent } from "../../types";
import { useFavorites } from "../../context/FavoritesContext";
import { EventCard } from "../shared/EventCard";
import { API_BASE_URL } from "../../services/api";
import "./EventSearch.css";

const GOOGLE_GEOCODING_API_KEY =
	(import.meta.env.VITE_GOOGLE_GEOCODING_API_KEY as string | undefined)?.trim() ??
	"";
const IPINFO_TOKEN =
	(import.meta.env.VITE_IPINFO_TOKEN as string | undefined)?.trim() ?? "";

const SearchIcon = (): JSX.Element => (
	<svg className="btn-icon" viewBox="0 0 20 20" aria-hidden="true">
		<path
			d="M13.5 12.4a6 6 0 1 0-1.1 1.1l3.7 3.7a.8.8 0 0 0 1.1-1.1zM8.7 13a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Z"
			fill="currentColor"
		/>
	</svg>
);

const ClearIcon = (): JSX.Element => (
	<svg className="clear-icon" viewBox="0 0 16 16" aria-hidden="true">
		<path
			d="M4.22 4.22a.75.75 0 0 1 1.06 0L8 6.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L9.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 0 1-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 0 1 0-1.06Z"
			fill="currentColor"
		/>
	</svg>
);

const ChevronDownIcon = (): JSX.Element => (
	<svg className="chevron-icon" viewBox="0 0 16 16" aria-hidden="true">
		<path
			d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
			fill="currentColor"
		/>
	</svg>
);

const ChevronUpIcon = (): JSX.Element => (
	<svg className="chevron-icon" viewBox="0 0 16 16" aria-hidden="true">
		<path
			d="M11.78 9.78a.75.75 0 0 1-1.06 0L8 7.06l-2.72 2.72a.75.75 0 1 1-1.06-1.06l3.25-3.25a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06Z"
			fill="currentColor"
		/>
	</svg>
);

const EmptyStateIcon = (): JSX.Element => (
	<svg className="empty-state-icon" viewBox="0 0 64 64" aria-hidden="true">
		<circle
			cx="28"
			cy="28"
			r="18"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
		/>
		<line
			x1="42"
			y1="42"
			x2="58"
			y2="58"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
		/>
	</svg>
);

type FormErrors = {
	keyword?: string;
	location?: string;
	distance?: string;
};

export const EventSearch = (): JSX.Element => {
	const navigate = useNavigate();
	const location = useLocation();
	const [keyword, setKeyword] = useState("");
	const [category, setCategory] = useState("All");
	const [locationInput, setLocationInput] = useState("");
	const [autoDetect, setAutoDetect] = useState(false);
	const [distance, setDistance] = useState("10");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [results, setResults] = useState<Event[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
	const { isFavorite, addFavorite, removeFavorite } = useFavorites();
	const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<string>>(
		() => new Set()
	);
	const suggestionRequestIdRef = useRef(0);
	const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastSuggestionQueryRef = useRef<string>("");

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

	const mapToEventPayload = useCallback(
		(item: FavoriteEvent | Event): Event => ({
			id: item.id,
			name: item.name,
			date: item.date,
			time: item.time,
			venue: item.venue,
			genre: item.genre,
			image: item.image,
			url: item.url,
		}),
		[]
	);

	// Restore state from navigation
	useEffect(() => {
		const searchState = location.state?.searchState;
		if (searchState) {
			setKeyword(searchState.keyword || "");
			setCategory(searchState.category || "All");
			setLocationInput(searchState.location || "");
			setAutoDetect(searchState.autoDetect || false);
			setDistance(searchState.distance || "10");
			setResults(searchState.results || []);
			setHasSearched(searchState.results?.length > 0);
			
			// Restore scroll position
			if (searchState.scrollPosition !== undefined) {
				// Use requestAnimationFrame to ensure DOM is updated
				requestAnimationFrame(() => {
					window.scrollTo(0, searchState.scrollPosition);
				});
			}
		}
	}, [location.state]);

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

		if (!autoDetect && !locationInput.trim()) {
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
		if (!IPINFO_TOKEN) {
			console.warn(
				"IPinfo token missing. Set VITE_IPINFO_TOKEN in your frontend environment."
			);
			return;
		}

		try {
			const response = await fetch(
				`https://ipinfo.io/json?token=${IPINFO_TOKEN}`
			);
			const data = await response.json();
			if (data.city && data.region) {
				setLocationInput(`${data.city}, ${data.region}`);
				clearError("location");
			}
		} catch (error) {
			console.error("Error fetching location:", error);
		}
	};

	const fetchSuggestions = useCallback(async (value: string) => {
		const trimmedValue = value.trim();

		if (trimmedValue.length < 1) {
			suggestionRequestIdRef.current += 1;
			lastSuggestionQueryRef.current = "";
			setSuggestions([]);
			setShowSuggestions(false);
			setIsFetchingSuggestions(false);
			return;
		}

		if (trimmedValue === lastSuggestionQueryRef.current) {
			return;
		}

		const currentRequestId = suggestionRequestIdRef.current + 1;
		suggestionRequestIdRef.current = currentRequestId;
		setIsFetchingSuggestions(true);

		try {
			const response = await fetch(
				`${API_BASE_URL}/events/suggestions?keyword=${encodeURIComponent(
					trimmedValue
				)}`
			);

			if (!response.ok) {
				throw new Error(
					`Suggestion API error: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			if (suggestionRequestIdRef.current === currentRequestId) {
				const items = Array.isArray(data.suggestions) ? data.suggestions : [];
				// Add user's input as the first option, followed by unique API suggestions
				const userInput = trimmedValue;
				const uniqueSuggestions = items.filter(
					(item: string) => item.toLowerCase() !== userInput.toLowerCase()
				);
				const allSuggestions = [userInput, ...uniqueSuggestions];
				setSuggestions(allSuggestions);
				setShowSuggestions(allSuggestions.length > 0);
				lastSuggestionQueryRef.current = trimmedValue;
			}
		} catch (error) {
			if (suggestionRequestIdRef.current === currentRequestId) {
				// Still show user's input even if API fails
				setSuggestions([trimmedValue]);
				setShowSuggestions(true);
			}
			console.error("Error fetching suggestions:", error);
		} finally {
			if (suggestionRequestIdRef.current === currentRequestId) {
				setIsFetchingSuggestions(false);
			}
		}
	}, [lastSuggestionQueryRef]);

	const debouncedFetchSuggestions = useCallback(
		(value: string) => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}

			debounceTimeoutRef.current = setTimeout(() => {
				void fetchSuggestions(value);
			}, 400);
		},
		[fetchSuggestions]
	);

	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	const handleKeywordChange = (value: string) => {
		setKeyword(value);
		const trimmedValue = value.trim();

		if (trimmedValue.length >= 1) {
			debouncedFetchSuggestions(value);
		} else {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
				debounceTimeoutRef.current = null;
			}
			suggestionRequestIdRef.current += 1;
			lastSuggestionQueryRef.current = "";
			setSuggestions([]);
			setShowSuggestions(false);
			setIsFetchingSuggestions(false);
		}

		if (trimmedValue) {
			clearError("keyword");
		}
	};

	const handleSuggestionClick = (suggestion: string) => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
			debounceTimeoutRef.current = null;
		}
		suggestionRequestIdRef.current += 1;
		lastSuggestionQueryRef.current = suggestion.trim();
		setKeyword(suggestion);
		setSuggestions([]);
		setShowSuggestions(false);
		setIsFetchingSuggestions(false);
		clearError("keyword");
	};

	const clearKeyword = () => {
		suggestionRequestIdRef.current += 1;
		lastSuggestionQueryRef.current = "";
		setKeyword("");
		setSuggestions([]);
		setShowSuggestions(false);
		setIsFetchingSuggestions(false);
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
			debounceTimeoutRef.current = null;
		}
		clearError("keyword");
	};

	const handleLocationChange = (value: string) => {
		setLocationInput(value);
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

	const geocodeLocation = async (
		locationStr: string
	): Promise<{ lat: number; lng: number } | null> => {
		try {
			if (!GOOGLE_GEOCODING_API_KEY) {
				console.warn(
					"Google Geocoding API key missing. Set VITE_GOOGLE_GEOCODING_API_KEY in your frontend environment."
				);
				return null;
			}
			const response = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
					locationStr
				)}&key=${GOOGLE_GEOCODING_API_KEY}`
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

  const handleFavoriteToggle = useCallback(
    async (
      eventToToggle: Event,
      _clickEvent?: ReactMouseEvent<HTMLButtonElement>
    ) => {
      if (pendingFavoriteIds.has(eventToToggle.id)) {
        return;
      }

      updatePendingFavorite(eventToToggle.id, true);

      try {
        if (isFavorite(eventToToggle.id)) {
          const removed = await removeFavorite(eventToToggle.id);
          toast.info(`${eventToToggle.name} removed from favorites!`, {
            action: {
              label: "Undo",
              onClick: async () => {
                try {
                  const payload = removed
                    ? mapToEventPayload(removed)
                    : mapToEventPayload(eventToToggle);
                  await addFavorite(payload);
                  toast.success(`${eventToToggle.name} re-added to favorites!`);
                } catch (undoError) {
                  console.error("Failed to undo favorite removal:", undoError);
                  toast.error("Unable to undo. Please try again.");
                }
              },
            },
          });
        } else {
          await addFavorite(eventToToggle);
          toast.success(`${eventToToggle.name} added to favorites!`, {
            description: "You can view it in the Favorites page.",
          });
        }
      } catch (error) {
        console.error("Error updating favorites:", error);
        toast.error("Unable to update favorites. Please try again.");
      } finally {
        updatePendingFavorite(eventToToggle.id, false);
      }
    },
    [
      pendingFavoriteIds,
      updatePendingFavorite,
      isFavorite,
      removeFavorite,
      mapToEventPayload,
      addFavorite,
    ]
  );

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
			const coords = await geocodeLocation(locationInput.trim());
			if (!coords) {
				setErrorMessage(
					"Unable to find the specified location. Please try again."
				);
				setIsLoading(false);
				return;
			}

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

	const hasKeyword = keyword.trim().length > 0;

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
							onFocus={() => {
								if (suggestions.length > 0) {
									setShowSuggestions(true);
								}
							}}
							placeholder="Search for events..."
							className={`form-input autocomplete-input${errors.keyword ? " error" : ""}`}
							aria-invalid={Boolean(errors.keyword)}
							aria-describedby={errors.keyword ? "keyword-error" : undefined}
							autoComplete="off"
							aria-busy={isFetchingSuggestions}
						/>
						<div className="autocomplete-end-control">
							{hasKeyword ? (
								<>
									<button
										type="button"
										onClick={clearKeyword}
										className="clear-input-btn"
										aria-label="Clear keyword input">
										<ClearIcon />
									</button>
									{isFetchingSuggestions ? (
										<span
											className="suggestions-spinner"
											role="status"
											aria-label="Loading suggestions"
										/>
									) : (
										<span className="dropdown-arrow" aria-hidden="true">
											{showSuggestions && suggestions.length > 0 ? (
												<ChevronUpIcon />
											) : (
												<ChevronDownIcon />
											)}
										</span>
									)}
								</>
							) : (
								<span className="dropdown-arrow" aria-hidden="true">
									<ChevronDownIcon />
								</span>
							)}
						</div>
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
							value={locationInput}
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
						<div className="empty-icon">
							<EmptyStateIcon />
						</div>
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
        {results.map((eventItem) => (
          <EventCard
            key={eventItem.id}
            event={eventItem}
            isFavorite={isFavorite(eventItem.id)}
            disabled={pendingFavoriteIds.has(eventItem.id)}
            onFavoriteToggle={(eventToToggle, clickEvent) => {
              void handleFavoriteToggle(eventToToggle, clickEvent);
            }}
            onSelect={(selectedEvent) => {
              navigate(`/event/${selectedEvent.id}`, {
                state: {
                  searchState: {
                    keyword,
                    category,
                    location: locationInput,
                    autoDetect,
                    distance,
                    results,
                    scrollPosition: window.scrollY,
                  },
                },
              });
            }}
          />
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
