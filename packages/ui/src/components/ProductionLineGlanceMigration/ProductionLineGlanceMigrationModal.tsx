/**
 * ProductionLineGlanceMigrationModal — accordion-style B0 mapping modal.
 *
 * Lists each unmapped (B0) investigation with its measurement column(s)
 * and suggested node mappings. Per-row Save / Skip / Decline. Pure
 * presentational; consumer owns persistence.
 *
 * See spec docs/superpowers/specs/2026-04-28-production-line-glance-surface-wiring-design.md
 * section "B0 migration UX".
 */
import React, { useEffect, useState } from 'react';

export interface ProductionLineGlanceMigrationSuggestion {
  nodeId: string;
  label: string;
  confidence: number;
}

export interface ProductionLineGlanceMigrationModalEntry {
  investigationId: string;
  investigationName: string;
  measurementColumn: string;
  suggestions: ReadonlyArray<ProductionLineGlanceMigrationSuggestion>;
}

export interface ProductionLineGlanceMigrationModalProps {
  isOpen: boolean;
  entries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>;
  onSave: (
    mappings: Array<{ investigationId: string; nodeId: string; measurementColumn: string }>
  ) => void;
  onDecline: (investigationId: string) => void;
  onClose: () => void;
}

function preselectFromSuggestions(
  entries: ReadonlyArray<ProductionLineGlanceMigrationModalEntry>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) {
    if (e.suggestions.length === 0) continue;
    const top = [...e.suggestions].sort((a, b) => b.confidence - a.confidence)[0];
    out[e.investigationId] = top.nodeId;
  }
  return out;
}

export const ProductionLineGlanceMigrationModal: React.FC<
  ProductionLineGlanceMigrationModalProps
> = ({ isOpen, entries, onSave, onDecline, onClose }) => {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    preselectFromSuggestions(entries)
  );

  useEffect(() => {
    if (isOpen) setSelected(preselectFromSuggestions(entries));
  }, [isOpen, entries]);

  if (!isOpen) return null;

  const handleSave = () => {
    const mappings = entries
      .filter(e => selected[e.investigationId])
      .map(e => ({
        investigationId: e.investigationId,
        nodeId: selected[e.investigationId],
        measurementColumn: e.measurementColumn,
      }));
    onSave(mappings);
  };

  return (
    <div
      role="dialog"
      aria-label="Map measurement columns to canonical nodes"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h2 className="text-base font-semibold text-content">Map columns to canonical nodes</h2>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="rounded p-1 text-content-secondary hover:bg-surface-tertiary hover:text-content"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 p-4">
          {entries.map(entry => (
            <section
              key={entry.investigationId}
              data-testid={`migration-row-${entry.investigationId}`}
              className="rounded-md border border-edge bg-surface-secondary p-3"
            >
              <header className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-content">{entry.investigationName}</h3>
                  <p className="text-xs text-content-secondary">
                    Column: <span className="font-mono">{entry.measurementColumn}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDecline(entry.investigationId)}
                  className="text-xs text-content-secondary hover:text-content"
                >
                  Skip
                </button>
              </header>

              {entry.suggestions.length === 0 ? (
                <p className="text-xs italic text-content-muted">
                  No node-mapping suggestions available.
                </p>
              ) : (
                <ul className="space-y-1">
                  {entry.suggestions.map(s => (
                    <li key={s.nodeId} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`mapping-${entry.investigationId}`}
                        id={`mapping-${entry.investigationId}-${s.nodeId}`}
                        value={s.nodeId}
                        checked={selected[entry.investigationId] === s.nodeId}
                        onChange={() =>
                          setSelected(prev => ({ ...prev, [entry.investigationId]: s.nodeId }))
                        }
                      />
                      <label
                        htmlFor={`mapping-${entry.investigationId}-${s.nodeId}`}
                        className="flex-1 text-sm text-content"
                      >
                        {s.label}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-edge px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-tertiary hover:text-content"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProductionLineGlanceMigrationModal;
