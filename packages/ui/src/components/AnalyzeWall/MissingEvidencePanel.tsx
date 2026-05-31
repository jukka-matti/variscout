/**
 * MissingEvidencePanel — rule-driven collapsible bar listing evidence gaps.
 *
 * Rendered below the Investigation Wall canvas. Driven by `SurveyHint[]` from
 * `surveyWallRules` — filters internally to data-collection (category 2) and
 * triangulation-readiness (category 3).
 *
 * Collapsed by default; expands to show a list of hints. Hub-targeted hints
 * render as focusable buttons so the analyst can jump to the relevant hub.
 */

import React, { useMemo, useState } from 'react';
import type { SurveyHint } from '@variscout/core/survey';
import { formatMessage, getMessage } from '@variscout/core/i18n';
import { useWallLocale } from './hooks/useWallLocale';

export interface MissingEvidencePanelProps {
  /**
   * Survey hints filtered to data-collection (category 2) + triangulation-readiness (category 3).
   * The panel does the filter itself — callers pass the full SurveyHint[] from surveyWallRules.
   */
  hints: SurveyHint[];
  /** Click handler when a hub-targeted hint is selected — focuses the hub on the canvas. */
  onFocusHub?: (hubId: string) => void;
  /**
   * FE-2b — activates the per-hint action button (was a disabled V2 stub). When
   * provided AND a hint targets a hub, the action ("Try disconfirmation") becomes
   * live and fires with the hint's `targetEntityId` so the app FOCUSES that hub
   * (opening its test plan). It does NOT pre-check "Try to break it" — the analyst
   * checks the per-factor box themselves once the triad is in view. When omitted,
   * the action button stays disabled (the legacy informative-only state).
   */
  onTriadAction?: (hubId: string) => void;
}

const SEVERITY_GLYPH: Record<SurveyHint['severity'], string> = {
  info: 'i',
  warning: '⚠',
  critical: '!',
};

export const MissingEvidencePanel: React.FC<MissingEvidencePanelProps> = ({
  hints,
  onFocusHub,
  onTriadAction,
}) => {
  const [expanded, setExpanded] = useState(false);
  const locale = useWallLocale();

  const filtered = useMemo(
    () => hints.filter(h => h.kind === 'data-collection' || h.kind === 'triangulation-readiness'),
    [hints]
  );

  if (filtered.length === 0) return null;

  const tagline = formatMessage(locale, 'wall.missing.tagline', { count: filtered.length });
  const toggleAriaLabel = expanded
    ? getMessage(locale, 'wall.missing.expanded')
    : getMessage(locale, 'wall.missing.collapsed');

  return (
    <section
      aria-label={getMessage(locale, 'wall.missing.ariaLabel')}
      className="border-t-2 border-dashed border-warning bg-surface p-3"
    >
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full text-xs uppercase tracking-wide font-mono text-warning"
        aria-expanded={expanded}
        aria-label={toggleAriaLabel}
      >
        <span>⚠ {tagline}</span>
        <span aria-hidden>{expanded ? '▾' : '▸'}</span>
      </button>
      {expanded && (
        <ul className="mt-2 flex flex-col gap-1 list-none p-0 m-0">
          {filtered.map(h => (
            <li
              key={`${h.kind}-${h.targetEntityId}`}
              className="text-xs text-content flex items-start gap-1"
            >
              <span aria-hidden className="shrink-0 font-mono text-warning">
                {SEVERITY_GLYPH[h.severity]}
              </span>
              <span className="flex-1 flex items-center justify-between gap-2">
                {h.targetEntityId && onFocusHub ? (
                  <button
                    type="button"
                    onClick={() => onFocusHub(h.targetEntityId)}
                    className="text-left hover:underline"
                  >
                    {h.message}
                  </button>
                ) : (
                  <span>{h.message}</span>
                )}
                {h.action?.label &&
                  // FE-2b — activated: when the app wires onTriadAction AND the
                  // hint targets a hub, the action FOCUSES that hub (opening its
                  // test plan; it does not pre-check "Try to break it"). Falls back
                  // to the legacy disabled stub otherwise.
                  (onTriadAction && h.targetEntityId ? (
                    <button
                      type="button"
                      data-testid="missing-evidence-action"
                      onClick={() => onTriadAction(h.targetEntityId)}
                      className="shrink-0 text-xs font-mono text-warning hover:underline"
                    >
                      {h.action.label}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="shrink-0 text-xs font-mono text-warning opacity-50 cursor-default"
                    >
                      {h.action.label}
                    </button>
                  ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
