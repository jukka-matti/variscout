// packages/ui/src/components/Explore/ScopeChrome/ScopeChip.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { SingleSelectPopover } from '../../SingleSelectPopover';
import { FilterChipDropdown } from '../../FilterChipDropdown/FilterChipDropdown';
import { createTestFilterChipData } from '../../../test-utils/filterChipFactories';

export type ScopeChipKind =
  | {
      kind: 'outcome';
      value: string;
      options: ReadonlyArray<{ columnName: string; label: string }>;
    }
  | {
      kind: 'factor';
      value: string | undefined;
      options: ReadonlyArray<{ columnName: string; label: string }>;
    }
  | {
      kind: 'step';
      value: string | undefined;
      options: ReadonlyArray<{ stepId: string; label: string }>;
    }
  | {
      kind: 'categorical';
      column: string;
      values: ReadonlyArray<string | number>;
      availableValues: ReadonlyArray<string | number>;
    };

export interface ScopeChipProps {
  readonly chip: ScopeChipKind;
  /** Whether the chip can be removed (Y chip is not removable when scope non-empty). */
  readonly removable: boolean;
}

function categoricalLabel(values: ReadonlyArray<string | number>): string {
  if (values.length === 0) return '(none)';
  if (values.length <= 2) return values.join(', ');
  return `${values.length} values`;
}

export function ScopeChip({ chip, removable }: ScopeChipProps) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>(undefined);
  const isOpen = anchorRect !== undefined;

  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
  };
  const close = () => setAnchorRect(undefined);

  const setY = useAnalysisScopeStore(s => s.setY);
  const setBoxplotFactor = useAnalysisScopeStore(s => s.setBoxplotFactor);
  const setStepId = useAnalysisScopeStore(s => s.setStepId);
  const setCategoricalValues = useAnalysisScopeStore(s => s.setCategoricalValues);
  const removeCategoricalFilter = useAnalysisScopeStore(s => s.removeCategoricalFilter);

  if (chip.kind === 'outcome') {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          data-testid="scope-chip-outcome"
          onClick={open}
          className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
        >
          Y: {chip.value} ▾
        </button>
        {isOpen && (
          <SingleSelectPopover
            options={chip.options.map(o => ({ value: o.columnName, label: o.label }))}
            activeValue={chip.value}
            onSelect={v => {
              setY(v);
              close();
            }}
            onClose={close}
            anchorRect={anchorRect}
            title="Outcome (Y)"
          />
        )}
      </span>
    );
  }

  if (chip.kind === 'factor') {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          data-testid="scope-chip-factor"
          onClick={open}
          className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
        >
          X: {chip.value ?? '(none)'} ▾
        </button>
        {removable && (
          <button
            type="button"
            data-testid="scope-chip-remove-factor"
            aria-label="Remove factor"
            onClick={() => setBoxplotFactor(undefined)}
            className="rounded p-1 text-content-secondary hover:text-content"
          >
            <X size={12} />
          </button>
        )}
        {isOpen && (
          <SingleSelectPopover
            options={chip.options.map(o => ({ value: o.columnName, label: o.label }))}
            activeValue={chip.value}
            onSelect={v => {
              setBoxplotFactor(v);
              close();
            }}
            onClose={close}
            anchorRect={anchorRect}
            title="Boxplot factor (X)"
          />
        )}
      </span>
    );
  }

  if (chip.kind === 'step') {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          data-testid="scope-chip-step"
          onClick={open}
          className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
        >
          step: {chip.value ?? 'all'} ▾
        </button>
        {removable && (
          <button
            type="button"
            data-testid="scope-chip-remove-step"
            aria-label="Remove step"
            onClick={() => setStepId(undefined)}
            className="rounded p-1 text-content-secondary hover:text-content"
          >
            <X size={12} />
          </button>
        )}
        {isOpen && (
          <SingleSelectPopover
            options={chip.options.map(o => ({ value: o.stepId, label: o.label }))}
            activeValue={chip.value}
            onSelect={v => {
              setStepId(v);
              close();
            }}
            onClose={close}
            anchorRect={anchorRect}
            title="Step"
            nullOption={{
              label: 'All steps',
              onSelect: () => {
                setStepId(undefined);
                close();
              },
            }}
          />
        )}
      </span>
    );
  }

  // categorical
  const chipData = createTestFilterChipData(
    chip.column,
    chip.values as (string | number)[],
    chip.availableValues as (string | number)[]
  );
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        data-testid={`scope-chip-categorical-${chip.column}`}
        onClick={open}
        className="inline-flex items-center gap-1 rounded-full border border-edge bg-surface-secondary px-3 py-1 text-sm text-content"
      >
        {chip.column}: {categoricalLabel(chip.values)} ▾
      </button>
      {removable && (
        <button
          type="button"
          data-testid={`scope-chip-remove-categorical-${chip.column}`}
          aria-label={`Remove ${chip.column} filter`}
          onClick={() => removeCategoricalFilter(chip.column)}
          className="rounded p-1 text-content-secondary hover:text-content"
        >
          <X size={12} />
        </button>
      )}
      {isOpen && (
        <FilterChipDropdown
          chipData={chipData}
          factorLabel={chip.column}
          onValuesChange={(factor, newValues) => setCategoricalValues(factor, newValues)}
          onClose={close}
          anchorRect={anchorRect}
        />
      )}
    </span>
  );
}
