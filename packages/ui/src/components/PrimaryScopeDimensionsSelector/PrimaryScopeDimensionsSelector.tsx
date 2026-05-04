// packages/ui/src/components/PrimaryScopeDimensionsSelector/PrimaryScopeDimensionsSelector.tsx
export interface DimensionRow {
  name: string;
  uniqueCount: number;
}

export interface PrimaryScopeDimensionsSelectorProps {
  columns: DimensionRow[];
  suggested: string[];
  value: string[];
  onChange: (next: string[]) => void;
  onSkip?: () => void;
}

const HIGH_CARD_THRESHOLD = 50;

export function PrimaryScopeDimensionsSelector({
  columns,
  suggested,
  value,
  onChange,
  onSkip,
}: PrimaryScopeDimensionsSelectorProps) {
  const toggle = (name: string) => {
    const next = value.includes(name) ? value.filter(n => n !== name) : [...value, name];
    onChange(next);
  };

  return (
    <div className="primary-scope-dimensions-selector">
      <h3>Primary scope dimensions</h3>
      <p className="hint">Which columns will you slice analysis by most often?</p>
      <ul>
        {columns.map(c => {
          const isSuggested = suggested.includes(c.name);
          const flagged = c.uniqueCount > HIGH_CARD_THRESHOLD;
          return (
            <li key={c.name}>
              <label>
                <input
                  type="checkbox"
                  checked={value.includes(c.name)}
                  onChange={() => toggle(c.name)}
                />
                <code>{c.name}</code> · {c.uniqueCount} levels
                {isSuggested && <span className="suggested-tag">suggested</span>}
                {flagged && <span className="flag">join key, not Pareto candidate</span>}
              </label>
            </li>
          );
        })}
      </ul>
      {onSkip && (
        <button type="button" onClick={onSkip}>
          Skip — set later
        </button>
      )}
    </div>
  );
}
