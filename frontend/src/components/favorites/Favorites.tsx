import type { JSX } from 'react';
import './Favorites.css';

export const Favorites = (): JSX.Element => {
  return (
    <div className="favorites-container">
      <div className="empty-state">
        <div className="empty-icon">❤️</div>
        <p className="empty-message">No favorites yet. Start adding events to your favorites!</p>
      </div>
    </div>
  );
};

