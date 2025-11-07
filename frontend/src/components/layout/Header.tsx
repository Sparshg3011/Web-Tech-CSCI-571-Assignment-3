import { type JSX, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Header.css';

const SearchIcon = (): JSX.Element => (
	<svg className="nav-icon" viewBox="0 0 20 20" aria-hidden="true">
		<path
			d="M13.5 12.4a6 6 0 1 0-1.1 1.1l3.7 3.7a.8.8 0 0 0 1.1-1.1zM8.7 13a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6Z"
			fill="currentColor"
		/>
	</svg>
);

const HeartIcon = (): JSX.Element => (
	<svg className="nav-icon" viewBox="0 0 20 20" aria-hidden="true">
		<path
			d="M10 17.2 8.9 16C5 12.6 2.5 10.4 2.5 7.5A3.6 3.6 0 0 1 6.1 4a3.6 3.6 0 0 1 3.9 2.5A3.6 3.6 0 0 1 13.9 4a3.6 3.6 0 0 1 3.6 3.5c0 2.9-2.5 5.1-6.4 8.5Z"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
	</svg>
);

const HamburgerIcon = (): JSX.Element => (
	<svg className="hamburger-icon" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M3 12h18M3 6h18M3 18h18"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

const CloseIcon = (): JSX.Element => (
	<svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M18 6L6 18M6 6l12 12"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
		/>
	</svg>
);

export const Header = (): JSX.Element => {
	const location = useLocation();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const isSearch = location.pathname === '/search' || location.pathname.startsWith('/event/');
	const isFavorites = location.pathname === '/favorites';

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen(!isMobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<header className="app-header">
			<div className="header-content">
				<h1 className="app-title">Events Around</h1>
				
				{/* Desktop Navigation */}
				<nav className="header-nav desktop-nav">
					<Link
						to="/search"
						className={`nav-link ${isSearch ? 'active' : ''}`}>
						<SearchIcon />
						<span>Search</span>
					</Link>
					<Link
						to="/favorites"
						className={`nav-link ${isFavorites ? 'active' : ''}`}>
						<HeartIcon />
						<span>Favorites</span>
					</Link>
				</nav>

				{/* Hamburger Menu Button */}
				<button 
					className="hamburger-button"
					onClick={toggleMobileMenu}
					aria-label="Toggle menu">
					{isMobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
				</button>
			</div>

			{/* Mobile Navigation */}
			{isMobileMenuOpen && (
				<nav className="mobile-nav">
					<Link
						to="/search"
						className={`nav-link ${isSearch ? 'active' : ''}`}
						onClick={closeMobileMenu}>
						<SearchIcon />
						<span>Search</span>
					</Link>
					<Link
						to="/favorites"
						className={`nav-link ${isFavorites ? 'active' : ''}`}
						onClick={closeMobileMenu}>
						<HeartIcon />
						<span>Favorites</span>
					</Link>
				</nav>
			)}
		</header>
	);
};

