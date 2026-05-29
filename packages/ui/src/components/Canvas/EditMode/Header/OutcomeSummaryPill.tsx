import { useMemo, useState } from 'react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { calculateChannelStats } from '@variscout/core';
import type { DataRow, OutcomeSpec } from '@variscout/core';
import { formatStatistic } from '@variscout/core/i18n';
import { OutcomeSpecsPopover } from '../OutcomeZone/OutcomeSpecsPopover';

export interface OutcomeSummaryPillProps {
  readonly rawData?: readonly DataRow[];
  readonly outcomeSpecs?: readonly OutcomeSpec[];
  readonly onOutcomeSpecApply?: (updated: OutcomeSpec) => void;
}

function filterByCategoricalScope(
  rows: readonly DataRow[],
  filters: ReadonlyArray<{ column: string; values: ReadonlyArray<string | number> }>
): readonly DataRow[] {
  if (filters.length === 0) return rows;
  return rows.filter(row =>
    filters.every(f => f.values.includes(row[f.column] as string | number))
  );
}

export function OutcomeSummaryPill(props: OutcomeSummaryPillProps) {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const outcomeSpec = props.outcomeSpecs?.find(o => o.columnName === yColumn);

  const filtered = useMemo(
    () => filterByCategoricalScope(props.rawData ?? [], categoricalFilters),
    [props.rawData, categoricalFilters]
  );

  const result = useMemo(
    () =>
      outcomeSpec && (outcomeSpec.usl !== undefined || outcomeSpec.lsl !== undefined)
        ? calculateChannelStats(filtered as DataRow[], outcomeSpec.columnName, {
            usl: outcomeSpec.usl,
            lsl: outcomeSpec.lsl,
          })
        : null,
    [filtered, yColumn, outcomeSpec]
  );

  if (!yColumn) return null;

  const cpkLabel = result?.cpk !== undefined ? `Cpk ${formatStatistic(result.cpk)}` : 'Cpk —';

  return (
    <>
      <span
        data-testid="outcome-summary-pill"
        className="inline-flex items-center gap-2 rounded-full bg-surface-secondary border border-edge px-3 py-1 text-sm text-content-secondary"
      >
        Active outcome: <span className="text-content font-medium">{yColumn}</span>
        <span aria-hidden="true">·</span>
        {cpkLabel}
        {outcomeSpec && (
          <button
            type="button"
            data-testid="outcome-summary-pill-spec-button"
            aria-label={`Open ${yColumn} spec`}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAnchor({ x: rect.right, y: rect.bottom });
            }}
            className="text-content-secondary hover:text-content"
          >
            ↗
          </button>
        )}
      </span>
      {anchor && outcomeSpec && (
        <OutcomeSpecsPopover
          spec={outcomeSpec}
          anchor={anchor}
          onApply={updated => {
            props.onOutcomeSpecApply?.(updated);
            setAnchor(null);
          }}
          onClose={() => setAnchor(null)}
        />
      )}
    </>
  );
}
