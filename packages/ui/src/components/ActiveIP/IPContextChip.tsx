import React from 'react';

export interface IPContextChipProps {
  title: string;
  onTitleClick: () => void;
  onExitIP: () => void;
}

const chipStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(99,102,241,0.06)',
  border: '1px solid rgba(99,102,241,0.2)',
  borderRadius: '999px',
  color: '#4f46e5',
};

export const IPContextChip: React.FC<IPContextChipProps> = ({ title, onTitleClick, onExitIP }) => (
  <span
    className="inline-flex max-w-full items-center gap-1 text-xs font-medium leading-tight"
    style={chipStyle}
    data-testid="ip-context-chip"
  >
    <span aria-hidden="true">◆</span> <span className="shrink-0">Working in IP:</span>{' '}
    <button
      type="button"
      onClick={onTitleClick}
      className="min-w-0 truncate font-semibold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label={`Open IP ${title}`}
    >
      {title}
    </button>{' '}
    <span aria-hidden="true">·</span>{' '}
    <button
      type="button"
      onClick={onExitIP}
      className="shrink-0 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Exit IP"
    >
      Exit IP
    </button>
  </span>
);
