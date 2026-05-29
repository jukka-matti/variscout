// packages/ui/src/components/Explore/ScopeChrome/AddFilterButton.tsx
import React, { useState } from 'react';
import { useAnalysisScopeStore } from '@variscout/stores';
import { SingleSelectPopover } from '../../SingleSelectPopover';
import { FilterChipDropdown } from '../../FilterChipDropdown';
import { createTestFilterChipData } from '../../../test-utils/filterChipFactories';

export interface AddFilterButtonProps {
  readonly availableFactors: ReadonlyArray<{ columnName: string; label: string }>;
  readonly categoricalValuesByColumn: Record<string, ReadonlyArray<string | number>>;
}

type Stage = 'closed' | 'picking' | 'editing';

export function AddFilterButton({
  availableFactors,
  categoricalValuesByColumn,
}: AddFilterButtonProps) {
  const [stage, setStage] = useState<Stage>('closed');
  const [pickedColumn, setPickedColumn] = useState<string | undefined>(undefined);
  const [anchorRect, setAnchorRect] = useState<DOMRect | undefined>(undefined);

  const categoricalFilters = useAnalysisScopeStore(s => s.categoricalFilters);
  const setCategoricalValues = useAnalysisScopeStore(s => s.setCategoricalValues);

  const activeColumns = new Set(categoricalFilters.map(f => f.column));
  const pickerOptions = availableFactors
    .filter(f => !activeColumns.has(f.columnName))
    .map(f => ({ value: f.columnName, label: f.label }));

  const close = () => {
    setStage('closed');
    setPickedColumn(undefined);
    setAnchorRect(undefined);
  };

  const open = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setStage('picking');
  };

  return (
    <span className="inline-flex">
      <button
        type="button"
        data-testid="add-filter-button"
        onClick={open}
        className="rounded-full border border-dashed border-edge px-3 py-1 text-sm text-content-secondary hover:text-content"
      >
        + filter
      </button>
      {stage === 'picking' && (
        <SingleSelectPopover
          options={pickerOptions}
          activeValue={undefined}
          onSelect={col => {
            setPickedColumn(col);
            setStage('editing');
          }}
          onClose={close}
          anchorRect={anchorRect}
          title="Add filter"
        />
      )}
      {stage === 'editing' && pickedColumn && (
        <FilterChipDropdown
          chipData={createTestFilterChipData(
            pickedColumn,
            [],
            (categoricalValuesByColumn[pickedColumn] ?? []) as (string | number)[]
          )}
          factorLabel={pickedColumn}
          onValuesChange={(factor, newValues) => setCategoricalValues(factor, newValues)}
          onClose={close}
          anchorRect={anchorRect}
        />
      )}
    </span>
  );
}
