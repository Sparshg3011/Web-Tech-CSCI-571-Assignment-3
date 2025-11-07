import type { ButtonHTMLAttributes, MouseEvent as ReactMouseEvent, JSX } from 'react';
import './FavoriteButton.css';

type FavoriteButtonVariant = 'card' | 'detail';

export interface FavoriteButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'onToggle'> {
  isActive: boolean;
  onToggle: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  variant?: FavoriteButtonVariant;
}

const HeartIcon = ({ active }: { active: boolean }): JSX.Element => (
  <svg
    className="favorite-button-icon"
    viewBox="0 0 20 20"
    aria-hidden="true"
    focusable="false">
    <path
      d="M10 17.2 8.9 16C5 12.6 2.5 10.4 2.5 7.5A3.6 3.6 0 0 1 6.1 4a3.6 3.6 0 0 1 3.9 2.5A3.6 3.6 0 0 1 13.9 4a3.6 3.6 0 0 1 3.6 3.5c0 2.9-2.5 5.1-6.4 8.5Z"
      fill={active ? '#dc2626' : 'none'}
      stroke={active ? '#dc2626' : '#1f2937'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FavoriteButton = ({
  isActive,
  onToggle,
  variant = 'card',
  className = '',
  disabled,
  ...rest
}: FavoriteButtonProps): JSX.Element => {
  const classes = [
    'favorite-button',
    `favorite-button--${variant}`,
    isActive ? 'favorite-button--active' : '',
    disabled ? 'favorite-button--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      {...rest}
      className={classes}
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={isActive}
      aria-label={isActive ? 'Remove from favorites' : 'Add to favorites'}>
      <HeartIcon active={isActive} />
    </button>
  );
};


