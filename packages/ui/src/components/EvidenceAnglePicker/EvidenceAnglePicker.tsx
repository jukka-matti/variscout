import React from 'react';
import type { FindingEvidenceType } from '@variscout/core/findings';

export interface EvidenceAnglePickerProps {
  value: FindingEvidenceType;
  onChange: (next: FindingEvidenceType) => void;
}

const ANGLES: Array<{ key: FindingEvidenceType; label: string; glyph: string }> = [
  { key: 'data', label: 'Data', glyph: '📊' },
  { key: 'gemba', label: 'Gemba', glyph: '👁' },
  { key: 'expert', label: 'Expert', glyph: '💬' },
];

export function EvidenceAnglePicker({
  value,
  onChange,
}: EvidenceAnglePickerProps): React.JSX.Element {
  return (
    <div role="radiogroup" aria-label="Evidence angle" className="flex gap-1">
      {ANGLES.map(angle => (
        <button
          key={angle.key}
          type="button"
          role="radio"
          aria-checked={value === angle.key}
          onClick={() => onChange(angle.key)}
          className={
            value === angle.key
              ? 'rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'
              : 'rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500'
          }
        >
          {angle.glyph} {angle.label}
        </button>
      ))}
    </div>
  );
}
