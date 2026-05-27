import { useEffect, useState } from 'react';
import type { OutcomeSpec } from '@variscout/core';
import type { CharacteristicType } from '@variscout/core/processHub';

export interface OutcomeSpecsPopoverProps {
  spec: OutcomeSpec;
  anchor: { x: number; y: number };
  onApply: (updated: OutcomeSpec) => void;
  onClose: () => void;
}

function parseNumber(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const TYPE_LABELS: Record<CharacteristicType, string> = {
  nominalIsBest: 'Nominal is best',
  smallerIsBetter: 'Smaller is better',
  largerIsBetter: 'Larger is better',
};

const TYPE_ORDER: readonly CharacteristicType[] = [
  'nominalIsBest',
  'smallerIsBetter',
  'largerIsBetter',
];

export function OutcomeSpecsPopover({ spec, anchor, onApply, onClose }: OutcomeSpecsPopoverProps) {
  const [characteristicType, setCharacteristicType] = useState<CharacteristicType>(
    spec.characteristicType
  );
  const [target, setTarget] = useState(spec.target?.toString() ?? '');
  const [lsl, setLsl] = useState(spec.lsl?.toString() ?? '');
  const [usl, setUsl] = useState(spec.usl?.toString() ?? '');
  const [cpkTarget, setCpkTarget] = useState(spec.cpkTarget?.toString() ?? '1.33');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const lslDisabled = characteristicType === 'smallerIsBetter';
  const uslDisabled = characteristicType === 'largerIsBetter';

  const handleApply = () => {
    onApply({
      ...spec,
      characteristicType,
      target: parseNumber(target),
      lsl: parseNumber(lsl),
      usl: parseNumber(usl),
      cpkTarget: parseNumber(cpkTarget) ?? 1.33,
    });
  };

  return (
    <>
      <div data-testid="specs-popover-backdrop" className="fixed inset-0 z-40" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Edit outcome specs"
        style={{ position: 'fixed', left: `${anchor.x}px`, top: `${anchor.y}px`, zIndex: 50 }}
        className="flex w-72 flex-col gap-3 rounded-md border border-edge bg-surface-primary p-4 shadow-lg"
      >
        <fieldset className="flex flex-col gap-1">
          <legend className="text-[10px] font-semibold uppercase tracking-wide text-content-tertiary">
            Characteristic
          </legend>
          {TYPE_ORDER.map(type => (
            <label key={type} className="flex items-center gap-2 text-sm text-content">
              <input
                type="radio"
                name="characteristicType"
                value={type}
                checked={characteristicType === type}
                onChange={() => setCharacteristicType(type)}
              />
              <span>{TYPE_LABELS[type]}</span>
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-1 text-sm text-content">
          <span>Target</span>
          <input
            type="number"
            step="any"
            value={target}
            onChange={e => setTarget(e.target.value)}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-content"
          />
        </label>

        <label
          className={`flex flex-col gap-1 text-sm ${
            lslDisabled ? 'text-content-tertiary' : 'text-content'
          }`}
        >
          <span>LSL</span>
          <input
            type="number"
            step="any"
            value={lsl}
            disabled={lslDisabled}
            onChange={e => setLsl(e.target.value)}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-content disabled:bg-surface-secondary disabled:text-content-tertiary"
          />
        </label>

        <label
          className={`flex flex-col gap-1 text-sm ${
            uslDisabled ? 'text-content-tertiary' : 'text-content'
          }`}
        >
          <span>USL</span>
          <input
            type="number"
            step="any"
            value={usl}
            disabled={uslDisabled}
            onChange={e => setUsl(e.target.value)}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-content disabled:bg-surface-secondary disabled:text-content-tertiary"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-content">
          <span>Cpk target</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cpkTarget}
            onChange={e => setCpkTarget(e.target.value)}
            className="rounded border border-edge bg-surface-primary px-2 py-1 text-content"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-sm text-content-secondary hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

export default OutcomeSpecsPopover;
