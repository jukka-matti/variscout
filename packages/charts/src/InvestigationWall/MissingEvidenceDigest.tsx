/**
 * MissingEvidenceDigest — collapsible summary bar listing evidence gaps.
 *
 * Rendered below the Investigation Wall canvas. Collapsed by default; expands
 * to show a list of gaps. Hub-linked gaps render as focusable buttons so the
 * analyst can jump directly to the relevant hub.
 */

import React, { useState } from 'react';
import { getMessage } from '@variscout/core/i18n';
import { getDocumentLocale } from './hooks/useWallLocale';

export interface MissingEvidenceGap {
  id: string;
  message: string;
  hubId?: string;
}

export interface MissingEvidenceDigestProps {
  gaps: MissingEvidenceGap[];
  onFocusHub?: (hubId: string) => void;
}

export const MissingEvidenceDigest: React.FC<MissingEvidenceDigestProps> = ({
  gaps,
  onFocusHub,
}) => {
  const [expanded, setExpanded] = useState(false);
  const locale = getDocumentLocale();

  if (gaps.length === 0) return null;

  const title = getMessage(locale, 'wall.missing.title');
  return (
    <section
      aria-label={getMessage(locale, 'wall.missing.ariaLabel')}
      className="border-t border-edge bg-surface p-3"
    >
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full text-xs uppercase tracking-wide font-mono text-warning"
        aria-expanded={expanded}
      >
        <span>
          ⚠ {title} · the detective move nobody ships ({gaps.length})
        </span>
        <span aria-hidden>{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <ul className="mt-2 flex flex-col gap-1 list-none p-0 m-0">
          {gaps.map(g => (
            <li key={g.id} className="text-xs text-content">
              {g.hubId && onFocusHub ? (
                <button
                  type="button"
                  onClick={() => onFocusHub(g.hubId!)}
                  className="text-left hover:underline"
                >
                  {g.message}
                </button>
              ) : (
                g.message
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
