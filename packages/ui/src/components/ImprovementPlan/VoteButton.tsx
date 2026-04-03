import React from 'react';
import { Star } from 'lucide-react';

export interface VoteButtonProps {
  voteCount: number;
  votedByMe: boolean;
  onToggle: () => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ voteCount, votedByMe, onToggle }) => (
  <button
    aria-pressed={votedByMe}
    onClick={onToggle}
    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-colors ${
      votedByMe
        ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
        : 'bg-surface-secondary text-content/40 border border-edge hover:border-amber-400/20 hover:text-amber-400/60'
    }`}
  >
    <Star size={12} fill={votedByMe ? 'currentColor' : 'none'} />
    <span className="font-semibold">{voteCount}</span>
  </button>
);
