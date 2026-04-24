/**
 * CommandPalette — ⌘K search palette for the Investigation Wall.
 *
 * Controlled modal. Filters across hubs (name), questions (text), and
 * findings (id or statement). Keyboard navigation:
 *  - Up/Down cycles the highlighted result (wraps)
 *  - Enter fires onPanTo(selectedId) + onClose
 *  - Escape fires onClose
 *
 * No fuzzy search dep — case-insensitive substring match is enough at the
 * expected scale (tens of hubs/questions on the Wall).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Finding, MessageCatalog, Question, SuspectedCause } from '@variscout/core';
import { getMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Called with the id of the selected result when Enter is pressed. */
  onPanTo: (nodeId: string) => void;
  hubs: SuspectedCause[];
  questions: Question[];
  findings: Finding[];
}

type ResultKind = 'hub' | 'question' | 'finding';
interface Result {
  id: string;
  kind: ResultKind;
  label: string;
}

const RESULT_KIND_KEY: Record<ResultKind, keyof MessageCatalog> = {
  hub: 'wall.palette.kind.hub',
  question: 'wall.palette.kind.question',
  finding: 'wall.palette.kind.finding',
};

function buildResults(
  hubs: SuspectedCause[],
  questions: Question[],
  findings: Finding[]
): Result[] {
  return [
    ...hubs.map<Result>(h => ({ id: h.id, kind: 'hub', label: h.name })),
    ...questions.map<Result>(q => ({ id: q.id, kind: 'question', label: q.text })),
    ...findings.map<Result>(f => ({
      id: f.id,
      kind: 'finding',
      label: f.text || f.id,
    })),
  ];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  onClose,
  onPanTo,
  hubs,
  questions,
  findings,
}) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const locale = useWallLocale();

  // Reset state when the palette opens afresh.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      // Autofocus so the user can start typing immediately.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const allResults = useMemo(
    () => buildResults(hubs, questions, findings),
    [hubs, questions, findings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allResults;
    return allResults.filter(r => r.label.toLowerCase().includes(q));
  }, [allResults, query]);

  // Clamp activeIdx when the filtered list shrinks.
  useEffect(() => {
    if (activeIdx >= filtered.length) {
      setActiveIdx(filtered.length === 0 ? 0 : filtered.length - 1);
    }
  }, [filtered.length, activeIdx]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (i + 1) % filtered.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const picked = filtered[activeIdx];
      if (picked) {
        onPanTo(picked.id);
        onClose();
      }
    }
  };

  return (
    <div
      data-testid="wall-command-palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-32 p-4"
      onMouseDown={e => {
        // Click on the backdrop (not inside the card) dismisses.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface w-full max-w-lg rounded-lg shadow-xl border border-edge overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          role="textbox"
          aria-label={getMessage(locale, 'wall.palette.placeholder')}
          placeholder={getMessage(locale, 'wall.palette.placeholder')}
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setActiveIdx(0);
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 bg-surface text-content text-sm border-b border-edge outline-none"
        />
        <ul
          className="max-h-80 overflow-y-auto"
          role="listbox"
          aria-activedescendant={
            filtered.length > 0 && filtered[activeIdx]
              ? `wall-palette-option-${filtered[activeIdx].kind}-${filtered[activeIdx].id}`
              : undefined
          }
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-content-muted text-sm">
              {getMessage(locale, 'wall.palette.empty')}
            </li>
          ) : (
            filtered.map((r, idx) => (
              <li
                key={`${r.kind}:${r.id}`}
                id={`wall-palette-option-${r.kind}-${r.id}`}
                role="option"
                aria-selected={idx === activeIdx}
                data-active={idx === activeIdx ? 'true' : undefined}
                data-result-kind={r.kind}
                className={
                  idx === activeIdx
                    ? 'px-4 py-2 bg-surface-secondary text-content text-sm cursor-pointer'
                    : 'px-4 py-2 text-content text-sm cursor-pointer hover:bg-surface-secondary'
                }
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => {
                  onPanTo(r.id);
                  onClose();
                }}
              >
                <span className="mr-2 uppercase text-[10px] tracking-wide font-mono text-content-muted">
                  {getMessage(locale, RESULT_KIND_KEY[r.kind])}
                </span>
                {r.label}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
