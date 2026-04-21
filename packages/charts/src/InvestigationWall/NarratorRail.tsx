/**
 * NarratorRail — Single evolving narrator pane for the Investigation Wall.
 *
 * In V1 it renders a CoScout suggestion feed. Takes a list of messages and
 * renders them in chronological order. Hideable via the `isOpen` prop;
 * parent controls visibility via `wallLayoutStore.railOpen`.
 *
 * When closed, renders a minimal button so the analyst can reopen.
 * This is an HTML panel (not SVG), rendered alongside the wall canvas.
 */

import React from 'react';
import { getMessage } from '@variscout/core/i18n';
import { getDocumentLocale } from './hooks/useWallLocale';

export interface NarratorMessage {
  id: string;
  kind: 'coach' | 'coscout' | 'human';
  text: string;
  timestamp: number;
  author?: string;
}

export interface NarratorRailProps {
  messages: NarratorMessage[];
  isOpen: boolean;
  onToggle?: () => void;
}

export const NarratorRail: React.FC<NarratorRailProps> = ({ messages, isOpen, onToggle }) => {
  const locale = getDocumentLocale();
  if (!isOpen) {
    return (
      <button
        type="button"
        aria-label={getMessage(locale, 'wall.rail.openAria')}
        onClick={onToggle}
        className="fixed right-2 top-20 rounded-full bg-surface-secondary border border-edge p-2"
        data-testid="narrator-rail-closed"
      >
        <span className="sr-only">{getMessage(locale, 'wall.rail.openButton')}</span>
        <span aria-hidden>●</span>
      </button>
    );
  }

  return (
    <aside
      aria-label={getMessage(locale, 'wall.rail.rootAria')}
      className="w-80 border-l border-edge bg-surface h-full overflow-y-auto p-3 flex flex-col gap-2"
      data-testid="narrator-rail-open"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content">
          {getMessage(locale, 'wall.rail.title')}
        </h2>
        <button
          type="button"
          aria-label={getMessage(locale, 'wall.rail.closeAria')}
          onClick={onToggle}
          className="text-content-muted hover:text-content"
        >
          ×
        </button>
      </header>
      {messages.length === 0 ? (
        <p className="text-xs text-content-muted">{getMessage(locale, 'wall.rail.empty')}</p>
      ) : (
        <ol className="flex flex-col gap-2 list-none p-0 m-0">
          {messages.map(m => (
            <li
              key={m.id}
              className="rounded border border-edge bg-surface-secondary p-2 text-xs text-content"
              data-kind={m.kind}
            >
              {m.author && (
                <span className="text-content-subtle text-[10px] font-mono mr-1">{m.author}</span>
              )}
              {m.text}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
};
