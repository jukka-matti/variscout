/**
 * ScopeBarBase — the conditional "Viewing condition" row (ER-4, spec §7.2;
 * wireframe :234-240 + CSS :59-65).
 *
 * A net-new ~32px row that sits directly under the context line whenever a
 * condition is applied. It shows the applied condition + its row coverage and
 * carries the two scope verbs: `× back to all data` (the coherent clear) and
 * `Take it to Analyze →` (mint/refresh the PSS, then navigate to the Wall).
 *
 *   ⌖ Viewing condition: <conditionLabel> · <nIn> of <nTotal> rows
 *     · [× back to all data] · [Take it to Analyze →]
 *
 * Props-based, NO store reads (a *Base primitive). The host owns mount/unmount
 * (it renders only when a condition is applied). Copy via the `scopeBar.*`
 * MessageCatalog keys; counts via `formatInteger` (locale-correct thousands
 * separators, matching the context line's N). Colours via the info theme tokens
 * only (tokens are @theme-only).
 */

import React from 'react';
import { formatInteger, formatMessage } from '@variscout/core/i18n';
import { useWallLocale } from '../../AnalyzeWall/hooks/useWallLocale';

export interface ScopeBarBaseProps {
  /** The applied condition, already formatted by the caller via `formatConditionLeaves`. */
  conditionLabel: string;
  /** Rows inside the condition. */
  nIn: number;
  /** Rows in the full (lensed) dataset. */
  nTotal: number;
  /** × back to all data — the coherent clear (host clears both stores + filterStack). */
  onClear(): void;
  /** Take it to Analyze → — mint/refresh the PSS, then navigate to the Wall. */
  onTakeToAnalyze(): void;
}

export const ScopeBarBase: React.FC<ScopeBarBaseProps> = ({
  conditionLabel,
  nIn,
  nTotal,
  onClear,
  onTakeToAnalyze,
}) => {
  const locale = useWallLocale();

  const rows = formatMessage(locale, 'scopeBar.rows', {
    nIn: formatInteger(nIn, locale),
    nTotal: formatInteger(nTotal, locale),
  });

  return (
    <div
      data-testid="scope-bar"
      role="status"
      aria-label={formatMessage(locale, 'scopeBar.ariaLabel', { label: conditionLabel })}
      className="flex h-8 flex-none items-center gap-2.5 border-b border-status-info bg-status-info-soft px-4 text-xs text-status-info"
    >
      <span className="shrink-0">{formatMessage(locale, 'scopeBar.viewing')}</span>
      <span className="min-w-0 truncate font-mono font-semibold" title={conditionLabel}>
        {conditionLabel}
      </span>
      <span className="shrink-0 font-mono">· {rows}</span>
      <button
        type="button"
        data-testid="scope-bar-clear"
        onClick={onClear}
        className="ml-1.5 shrink-0 rounded-full border border-status-info bg-surface px-2.5 py-0.5 text-[11px] text-status-info hover:bg-surface-secondary"
      >
        {formatMessage(locale, 'scopeBar.clear')}
      </button>
      <button
        type="button"
        data-testid="scope-bar-analyze"
        onClick={onTakeToAnalyze}
        className="ml-auto shrink-0 rounded-md bg-status-info px-3 py-1 font-semibold text-surface hover:opacity-90"
      >
        {formatMessage(locale, 'scopeBar.analyze')}
      </button>
    </div>
  );
};
