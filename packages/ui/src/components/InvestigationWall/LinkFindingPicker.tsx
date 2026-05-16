import { useState } from 'react';
import type { Finding, Hypothesis } from '@variscout/core';
import type { MeasurementPlan } from '@variscout/core/measurementPlan';

export interface LinkFindingPickerProps {
  hypothesis: Pick<Hypothesis, 'id' | 'findingIds'>;
  plan: Pick<MeasurementPlan, 'id' | 'linkedFindingIds'>;
  findings: Finding[];
  onConfirm: (findingIds: Finding['id'][]) => void;
  onCancel: () => void;
}

export function LinkFindingPicker({
  hypothesis,
  plan,
  findings,
  onConfirm,
  onCancel,
}: LinkFindingPickerProps) {
  const linkedSet = new Set(plan.linkedFindingIds ?? []);
  const eligible = findings.filter(
    f => hypothesis.findingIds.includes(f.id) && !linkedSet.has(f.id)
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-96"
    >
      <h3 className="text-base font-semibold mb-3">Link findings to plan</h3>
      {eligible.length === 0 ? (
        <p className="text-sm text-gray-600 mb-3">
          No unlinked findings available for this hypothesis.
        </p>
      ) : (
        <ul className="space-y-2 mb-3 max-h-64 overflow-y-auto">
          {eligible.map(f => (
            <li key={f.id} className="flex items-start gap-2">
              <input
                id={`finding-${f.id}`}
                type="checkbox"
                className="mt-0.5"
                checked={selected.has(f.id)}
                onChange={() => toggle(f.id)}
              />
              <label htmlFor={`finding-${f.id}`} className="text-sm cursor-pointer">
                {f.text}
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 justify-end">
        {eligible.length > 0 && (
          <button
            type="button"
            disabled={selected.size === 0}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            onClick={() => onConfirm(Array.from(selected))}
          >
            Link selected
          </button>
        )}
        <button
          type="button"
          className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
