import React from 'react';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible label for the control group — required for screen-reader context. */
  'aria-label': string;
  /** data-testid prefix; each button gets `${testId}-${option.value}` */
  testId?: string;
}

/**
 * SegmentedControl — compact pill-style control for mutually exclusive selections.
 *
 * Renders a row of buttons sharing a pill container; the active button has an
 * elevated background. Matches the visual language used for the Verify card tab
 * bar and the ProcessHealthBar Time-lens popover mode grid.
 *
 * Generic over the value union so callers retain strict typing.
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  testId,
}: SegmentedControlProps<T>): React.ReactElement | null {
  if (options.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex gap-0.5 bg-surface/50 p-0.5 rounded-lg border border-edge/50"
      data-export-hide
    >
      {options.map(option => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            data-testid={testId ? `${testId}-${option.value}` : undefined}
            className={`flex-1 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-surface-tertiary text-content shadow-sm'
                : 'text-content-secondary hover:text-content'
            }`}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
