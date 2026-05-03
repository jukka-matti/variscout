// packages/ui/src/components/OutcomeCandidateRow/OutcomeCandidateRow.tsx
import type { CharacteristicType, OutcomeSpec } from '@variscout/core/processHub';

export interface OutcomeCandidate {
  columnName: string;
  type: 'continuous' | 'discrete';
  characteristicType: CharacteristicType;
  values: number[];
  matchScore: number;
  goalKeywordMatch?: string;
  qualityReport: { validCount: number; invalidCount: number; missingCount: number };
}

export interface OutcomeCandidateRowProps {
  candidate: OutcomeCandidate;
  isSelected: boolean;
  onToggleSelect: () => void;
  specs: Partial<OutcomeSpec>;
  onSpecsChange: (next: Partial<OutcomeSpec>) => void;
}

export function OutcomeCandidateRow(props: OutcomeCandidateRowProps) {
  const { candidate, isSelected, onToggleSelect, specs, onSpecsChange } = props;
  const lslDisabled = candidate.characteristicType === 'smallerIsBetter';
  const uslDisabled = candidate.characteristicType === 'largerIsBetter';

  const updateSpec = (key: keyof OutcomeSpec, raw: string) => {
    const trimmed = raw.trim();
    const numeric = trimmed === '' ? undefined : Number.parseFloat(trimmed);
    onSpecsChange({ ...specs, [key]: Number.isFinite(numeric) ? numeric : undefined });
  };

  return (
    <div className={`outcome-candidate-row ${isSelected ? 'selected' : ''}`}>
      <input
        type="radio"
        checked={isSelected}
        onChange={onToggleSelect}
        aria-label={candidate.columnName}
      />
      <div className="col-info">
        <div className="col-name">{candidate.columnName}</div>
        <div className="col-type">
          {candidate.type} · n={candidate.qualityReport.validCount}
        </div>
      </div>
      <Sparkline values={candidate.values} />
      {isSelected && (
        <div className="specs-inline" onClick={e => e.stopPropagation()}>
          <label>
            Target
            <input
              value={specs.target ?? ''}
              onChange={e => updateSpec('target', e.target.value)}
            />
          </label>
          <label>
            LSL
            <input
              value={specs.lsl ?? ''}
              disabled={lslDisabled}
              placeholder={lslDisabled ? '—' : 'from customer spec'}
              onChange={e => updateSpec('lsl', e.target.value)}
            />
          </label>
          <label>
            USL
            <input
              value={specs.usl ?? ''}
              disabled={uslDisabled}
              placeholder={uslDisabled ? '—' : 'from customer spec'}
              onChange={e => updateSpec('usl', e.target.value)}
            />
          </label>
          <label>
            Cpk ≥
            <input
              value={specs.cpkTarget ?? '1.33'}
              onChange={e => updateSpec('cpkTarget', e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="quality-stack">
        {candidate.qualityReport.missingCount === 0
          ? '✓ no missing'
          : `⚠ ${candidate.qualityReport.missingCount} missing`}
      </div>
      <div className="match-confidence">
        {Math.round(candidate.matchScore * 100)}%
        {candidate.goalKeywordMatch && <div className="kw">"{candidate.goalKeywordMatch}"</div>}
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const buckets = new Array(8).fill(0);
  values.forEach(v => {
    const idx = Math.min(7, Math.floor(((v - min) / range) * 8));
    buckets[idx]++;
  });
  const peak = Math.max(...buckets) || 1;
  return (
    <svg className="sparkline" viewBox="0 0 80 22" preserveAspectRatio="none">
      {buckets.map((count, i) => (
        <rect
          key={i}
          x={2 + i * 9}
          y={22 - (count / peak) * 22}
          width={6}
          height={(count / peak) * 22}
        />
      ))}
    </svg>
  );
}
