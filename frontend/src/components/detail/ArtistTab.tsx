import { useEffect, useState, type JSX } from 'react';
import type {
	EventDetail,
	SpotifyAlbumInfo,
	SpotifyArtistInfo,
	SpotifyArtistResponse,
} from '../../types';
import { API_BASE_URL } from '../../services/api';
import './ArtistTab.css';

interface ArtistTabProps {
	eventDetail: EventDetail;
}

interface ArtistData {
	artist: SpotifyArtistInfo | null;
	albums: SpotifyAlbumInfo[];
	isLoading: boolean;
	error: string | null;
}

export const ArtistTab = ({ eventDetail }: ArtistTabProps): JSX.Element => {
	const [artistData, setArtistData] = useState<ArtistData>({
		artist: null,
		albums: [],
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		const fetchArtistData = async () => {
			if (!eventDetail.artists || eventDetail.artists.length === 0) {
				setArtistData({
					artist: null,
					albums: [],
					isLoading: false,
					error: 'No artist information available',
				});
				return;
			}

			try {
				setArtistData((prev) => ({ ...prev, isLoading: true, error: null }));

				const artistName = eventDetail.artists[0].name;
				const response = await fetch(
					`${API_BASE_URL}/events/spotify/artist?name=${encodeURIComponent(artistName)}`
				);

				if (response.status === 404) {
					setArtistData({
						artist: null,
						albums: [],
						isLoading: false,
						error: 'Artist not found on Spotify',
					});
					return;
				}

				if (!response.ok) {
					throw new Error('Failed to fetch Spotify artist data');
				}

				const data: SpotifyArtistResponse = await response.json();

				if (!data.artist) {
					setArtistData({
						artist: null,
						albums: [],
						isLoading: false,
						error: 'Artist not found on Spotify',
					});
					return;
				}

				setArtistData({
					artist: data.artist,
					albums: data.albums ?? [],
					isLoading: false,
					error: null,
				});
			} catch (error) {
				console.error('Error fetching artist data:', error);
				setArtistData({
					artist: null,
					albums: [],
					isLoading: false,
					error: 'Failed to load artist information',
				});
			}
		};

		fetchArtistData();
	}, [eventDetail.artists]);

	const formatFollowers = (count: number): string => {
		return new Intl.NumberFormat('en-US').format(count);
	};

	const formatPopularity = (popularity: number): string => {
		return `${popularity}%`;
	};

	if (artistData.isLoading) {
		return (
			<div className="artist-tab-container">
				<div className="artist-tab-loading">
					<div className="loader" />
					<p>Loading artist information...</p>
				</div>
			</div>
		);
	}

	if (artistData.error || !artistData.artist) {
		return (
			<div className="artist-tab-container">
				<div className="artist-tab-error">
					<p>{artistData.error || 'No artist information available'}</p>
				</div>
			</div>
		);
	}

	const { artist, albums } = artistData;

	return (
		<div className="artist-tab-container">
			<div className="artist-info-card">
				{artist.image && (
					<img
						src={artist.image}
						alt={artist.name}
						className="artist-image"
					/>
				)}
				<div className="artist-info">
					<h2 className="artist-name">{artist.name}</h2>
					<div className="artist-stats">
						<div className="artist-stats-row">
							<p className="artist-followers">
								Followers: {formatFollowers(artist.followers)}
							</p>
							<p className="artist-popularity">
								Popularity: {formatPopularity(artist.popularity)}
							</p>
						</div>
						{artist.genres && artist.genres.length > 0 && (
							<p className="artist-genres">
								Genres: {artist.genres.slice(0, 3).join(', ')}
							</p>
						)}
					</div>
					{artist.spotifyUrl && (
						<a
							href={artist.spotifyUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="spotify-link-button">
							Open in Spotify
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
						</a>
					)}
				</div>
			</div>

			{albums.length > 0 && (
				<div className="albums-section">
					<h3 className="albums-title">Albums</h3>
					<div className="albums-grid">
						{albums.map((album) => (
							<a
								key={album.id}
								href={album.spotifyUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="album-card">
								{album.image && (
									<img
										src={album.image}
										alt={album.name}
										className="album-image"
									/>
								)}
								<div className="album-info">
									<h4 className="album-name">{album.name}</h4>
									<p className="album-date">{album.releaseDate}</p>
									<p className="album-tracks">
										{`${album.totalTracks ?? 0} track${(album.totalTracks ?? 0) === 1 ? '' : 's'}`}
									</p>
								</div>
							</a>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

