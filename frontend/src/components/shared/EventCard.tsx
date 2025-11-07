import type { JSX } from 'react';
import type { Event } from '../../types';
import { FavoriteButton } from './FavoriteButton';
import './EventCard.css';

interface EventCardProps {
  event: Event;
  isFavorite: boolean;
  onFavoriteToggle: (
    event: Event,
    clickEvent: React.MouseEvent<HTMLButtonElement>
  ) => void;
  disabled?: boolean;
  onSelect?: (event: Event) => void;
}

const fallbackImage = 'https://via.placeholder.com/400x250?text=No+Image';

const formatCardDate = (event: Event): string => {
  if (!event.date) {
    return 'Date TBD';
  }

  const base = `${event.date}T${event.time || '00:00:00'}`;
  const parsedDate = new Date(base);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date TBD';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate);
};

export const EventCard = ({
  event,
  isFavorite,
  onFavoriteToggle,
  disabled = false,
  onSelect,
}: EventCardProps): JSX.Element => {
  const handleCardClick = () => {
    if (onSelect) {
      onSelect(event);
    }
  };

  const handleKeyDown = (keyboardEvent: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) {
      return;
    }

    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
      keyboardEvent.preventDefault();
      onSelect(event);
    }
  };

  return (
    <div
      className="result-card"
      role="listitem"
      tabIndex={onSelect ? 0 : -1}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}>
      <div className="result-card-image">
        <img src={event.image || fallbackImage} alt={event.name} loading="lazy" />
        <div className="result-card-overlay">
          <span className="result-card-badge">{event.genre || 'Miscellaneous'}</span>
          <span className="result-card-date">{formatCardDate(event)}</span>
        </div>
      </div>
      <div className="result-card-body">
        <div className="result-card-body-content">
          <h3 className="result-card-title">{event.name}</h3>
          <p className="result-card-venue">{event.venue || 'Venue TBD'}</p>
        </div>
        <div className="result-card-footer">
          <FavoriteButton
            variant="card"
            isActive={isFavorite}
            onToggle={(clickEvent) => {
              clickEvent.stopPropagation();
              onFavoriteToggle(event, clickEvent);
            }}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};


