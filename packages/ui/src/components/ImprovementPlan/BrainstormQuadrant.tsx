import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { IdeaDirection } from '@variscout/core';
import type { BrainstormIdea } from '@variscout/core/findings';

export interface BrainstormQuadrantProps {
  direction: IdeaDirection;
  hmwPrompt: string;
  ideas: BrainstormIdea[];
  onAddIdea: (direction: IdeaDirection, text: string) => void;
  onEditIdea: (ideaId: string, text: string) => void;
  onRemoveIdea: (ideaId: string) => void;
}

const DIRECTION_STYLES: Record<IdeaDirection, { badge: string; border: string; bg: string }> = {
  prevent: {
    badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    border: 'border-l-purple-500/30',
    bg: 'bg-purple-500/5',
  },
  detect: {
    badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500/30',
    bg: 'bg-blue-500/5',
  },
  simplify: {
    badge: 'bg-green-500/15 text-green-600 dark:text-green-400',
    border: 'border-l-green-500/30',
    bg: 'bg-green-500/5',
  },
  eliminate: {
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    border: 'border-l-amber-500/30',
    bg: 'bg-amber-500/5',
  },
};

const DIRECTION_LABELS: Record<IdeaDirection, string> = {
  prevent: 'Prevent',
  detect: 'Detect',
  simplify: 'Simplify',
  eliminate: 'Eliminate',
};

export const BrainstormQuadrant: React.FC<BrainstormQuadrantProps> = ({
  direction,
  hmwPrompt,
  ideas,
  onAddIdea,
  onEditIdea,
  onRemoveIdea,
}) => {
  const [inputValue, setInputValue] = useState('');
  const styles = DIRECTION_STYLES[direction];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddIdea(direction, inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 min-h-[120px]">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles.badge}`}>
          {DIRECTION_LABELS[direction]}
        </span>
      </div>
      <p className="text-xs text-content/50 italic">{hmwPrompt}</p>

      <div className="flex flex-col gap-1">
        {ideas.map(idea => (
          <div
            key={idea.id}
            className={`group flex items-start gap-2 text-sm px-2 py-1.5 rounded border-l-2 ${styles.border} ${styles.bg}`}
          >
            <span
              className="flex-1 outline-none"
              contentEditable
              suppressContentEditableWarning
              onBlur={e => {
                const newText = e.currentTarget.textContent?.trim();
                if (newText && newText !== idea.text) {
                  onEditIdea(idea.id, newText);
                }
              }}
            >
              {idea.text}
            </span>
            {idea.aiGenerated && (
              <span className="text-[10px] text-content/30 flex-shrink-0">✨</span>
            )}
            <button
              aria-label="remove"
              onClick={() => onRemoveIdea(idea.id)}
              className="opacity-0 group-hover:opacity-100 text-content/30 hover:text-content/60 flex-shrink-0 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="+ type an idea..."
          className="text-xs text-content/40 italic bg-transparent outline-none px-2 py-1 placeholder:text-content/30"
        />
      </div>
    </div>
  );
};
