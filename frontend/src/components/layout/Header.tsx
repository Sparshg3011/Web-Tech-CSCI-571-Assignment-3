import { useState, type JSX } from 'react';
import './Header.css';

interface HeaderProps {
  onTabChange?: (tab: 'search' | 'favorites') => void;
}

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

export const Header = ({ onTabChange }: HeaderProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');

  const handleTabClick = (tab: 'search' | 'favorites') => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="app-title">Events Around</h1>
        <nav className="header-nav">
          <button
            className={`nav-link ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
          >
            <SearchIcon />
            <span>Search</span>
          </button>
          <button
            className={`nav-link ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => handleTabClick('favorites')}
          >
            <HeartIcon />
            <span>Favorites</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

