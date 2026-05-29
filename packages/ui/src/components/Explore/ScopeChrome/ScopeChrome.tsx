// packages/ui/src/components/Explore/ScopeChrome/ScopeChrome.tsx
import { useAnalysisScopeStore } from '@variscout/stores';
import { ScopeChip } from './ScopeChip';
import { AddFilterButton } from './AddFilterButton';
import { EmptyStateHint } from './EmptyStateHint';

export interface ScopeChromeProps {
  readonly availableOutcomes: ReadonlyArray<{ columnName: string; label: string }>;
  readonly availableFactors: ReadonlyArray<{ columnName: string; label: string }>;
  readonly availableSteps: ReadonlyArray<{ stepId: string; label: string }>;
  readonly categoricalValuesByColumn: Record<string, ReadonlyArray<string | number>>;
  readonly onNavigateToProcess?: () => void;
}

export function ScopeChrome({
  availableOutcomes,
  availableFactors,
  availableSteps,
  categoricalValuesByColumn,
  onNavigateToProcess,
}: ScopeChromeProps) {
  const yColumn = useAnalysisScopeStore(s => s.yColumn);
  const boxplotFactor = useAnalysisScopeStore(s => s.boxplotFactor);
  const stepId = useAnalysisScopeStore(s => s.stepId);
  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const clearScope = useAnalysisScopeStore(s => s.clearScope);

  if (!yColumn) {
    return (
      <div data-testid="scope-chrome" className="border-b border-edge bg-surface px-4 py-2">
        <EmptyStateHint onNavigateToProcess={onNavigateToProcess} />
      </div>
    );
  }

  return (
    <div
      data-testid="scope-chrome"
      className="flex flex-wrap items-center gap-2 border-b border-edge bg-surface px-4 py-2 text-sm"
    >
      <span className="text-content-muted">scope:</span>
      <ScopeChip
        chip={{ kind: 'outcome', value: yColumn, options: availableOutcomes }}
        removable={false}
      />
      <ScopeChip
        chip={{ kind: 'factor', value: boxplotFactor, options: availableFactors }}
        removable={Boolean(boxplotFactor)}
      />
      <ScopeChip
        chip={{ kind: 'step', value: stepId, options: availableSteps }}
        removable={Boolean(stepId)}
      />
      {categoricalFilters.map(f => (
        <ScopeChip
          key={f.column}
          chip={{
            kind: 'categorical',
            column: f.column,
            values: f.values,
            availableValues: categoricalValuesByColumn[f.column] ?? [],
          }}
          removable={true}
        />
      ))}
      <AddFilterButton
        availableFactors={availableFactors}
        categoricalValuesByColumn={categoricalValuesByColumn}
      />
      <button
        type="button"
        data-testid="scope-chrome-clear-all"
        onClick={() => clearScope()}
        className="ml-auto text-xs text-content-secondary underline hover:text-content"
      >
        clear all
      </button>
    </div>
  );
}
