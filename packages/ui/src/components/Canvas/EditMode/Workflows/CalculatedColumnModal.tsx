import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FocusTrap from 'focus-trap-react';
import type {
  FormulaBinding,
  FormulaTemplate,
  FormulaTerm,
  TemplateContext,
} from '@variscout/core';
import { FORMULA_TEMPLATES, detectBatchData } from '@variscout/core';
import type { ColumnParsingProfile } from '@variscout/core/parser';

/** Slot identifier for the Custom tab composer. */
type SlotId = 'numerator' | 'denominator';

export interface CalculatedColumnModalProps {
  /** When provided, the modal treats this column as the kebab origin (e.g. pre-fill DPMO numerator). */
  sourceColumn?: string;
  /** All raw column profiles (for batch detection inside modal + listing numeric columns). */
  rawProfiles: ColumnParsingProfile[];
  /** Map of numeric column name → values (raw + augmented from D1's Lead_time etc.). */
  numericValuesByColumn: Record<string, number[]>;
  /** Raw row dictionaries for live preview computation in Task 7. */
  rows: ReadonlyArray<Record<string, unknown>>;
  /** Set true when D1's Lead_time augmented column is available (gates Throughput template). */
  hasLeadTime: boolean;
  /** Names of columns already in the palette (raw + derived) — for Task 8's duplicate-name guard. */
  existingDerivedNames: string[];
  /** Called with the user's saved binding. */
  onSave: (binding: FormulaBinding) => void;
  /** Called on Escape + backdrop click + Cancel button. */
  onClose: () => void;
}

type TabId = 'templates' | 'custom';

/**
 * CalculatedColumnModal — Task 5 skeleton + Templates tab card grid.
 *
 * Mirrors `StepTimingsModal` for the shell (FocusTrap + fixed backdrop + Escape +
 * click-outside close). Hosts two tabs: **Templates** (active by default) and
 * **Custom formula** (placeholder — implemented in Task 6).
 *
 * Templates tab: renders a card grid filtered by each template's `isAvailable(ctx)`.
 * Batch-detected templates get a `data-recommended="true"` marker + emerald highlight.
 * Throughput card is disabled when `hasLeadTime` is false.
 *
 * Custom formula tab: placeholder panel for Task 6 to replace.
 */
export const CalculatedColumnModal: React.FC<CalculatedColumnModalProps> = ({
  sourceColumn,
  rawProfiles,
  numericValuesByColumn,
  rows: _rows,
  hasLeadTime,
  existingDerivedNames: _existingDerivedNames,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('templates');

  // -------------------------------------------------------------------------
  // Custom tab state (kept lifted here so tab-switching preserves it).
  // -------------------------------------------------------------------------
  const [customName, setCustomName] = useState('');
  const [customNumerator, setCustomNumerator] = useState<FormulaTerm[]>([]);
  const [customDenominator, setCustomDenominator] = useState<FormulaTerm[]>([]);
  const [customMultiplier, setCustomMultiplier] = useState(1);
  const [focusedSlot, setFocusedSlot] = useState<SlotId | null>(null);
  // Fly-in animation key — stamped per add. Cleared after the transition window.
  const [flyInKey, setFlyInKey] = useState<string | null>(null);
  // Map of palette column → DOMRect used to compute fly-in delta.
  const paletteRectsRef = useRef<Record<string, DOMRect>>({});
  // Map of slot → DOMRect for the slot container (target of the fly-in).
  const slotRectsRef = useRef<Record<SlotId, DOMRect | null>>({
    numerator: null,
    denominator: null,
  });
  // Per-key fly-in delta (set the frame the chip mounts; cleared via rAF).
  const [flyInDelta, setFlyInDelta] = useState<{ dx: number; dy: number } | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Auto-focus dialog on mount.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape closes.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Derive numeric column names from the provided value map.
  const numericColumns = useMemo(() => Object.keys(numericValuesByColumn), [numericValuesByColumn]);

  // Run batch detection on the raw profiles.
  const batchData = useMemo(() => detectBatchData(rawProfiles), [rawProfiles]);

  // Build the TemplateContext for isAvailable + fillFromContext.
  const templateCtx = useMemo<TemplateContext>(
    () => ({ batchData, hasLeadTime, numericColumns }),
    [batchData, hasLeadTime, numericColumns]
  );

  const handleTemplateSelect = (template: FormulaTemplate) => {
    const binding = template.fillFromContext(templateCtx, sourceColumn);
    onSave(binding);
  };

  // -------------------------------------------------------------------------
  // Custom tab handlers.
  // -------------------------------------------------------------------------

  /** Register a palette chip's bounding rect (called by the chip on mount/render). */
  const registerPaletteRect = useCallback((column: string, rect: DOMRect | null) => {
    if (rect) paletteRectsRef.current[column] = rect;
  }, []);

  /** Register a slot's bounding rect (called by the slot on mount/render). */
  const registerSlotRect = useCallback((slot: SlotId, rect: DOMRect | null) => {
    slotRectsRef.current[slot] = rect;
  }, []);

  const handleAddToSlot = useCallback(
    (column: string) => {
      // If no slot focused, default to numerator AND focus it in the same gesture.
      const target: SlotId = focusedSlot ?? 'numerator';
      if (focusedSlot === null) setFocusedSlot('numerator');

      const newTerm: FormulaTerm = { kind: 'column', column, sign: '+' };
      const key = `${target}:${column}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

      // Compute fly-in delta from palette chip → slot container. In jsdom both
      // rects are { x:0, y:0, ...zeroes }, so delta resolves to (0, 0) and the
      // animation is a no-op — tests stay deterministic.
      const paletteRect = paletteRectsRef.current[column];
      const slotRect = slotRectsRef.current[target];
      if (paletteRect && slotRect) {
        const dx = paletteRect.left - slotRect.left;
        const dy = paletteRect.top - slotRect.top;
        setFlyInDelta({ dx, dy });
      } else {
        setFlyInDelta(null);
      }
      setFlyInKey(key);

      if (target === 'numerator') {
        setCustomNumerator(prev => [...prev, newTerm]);
      } else {
        setCustomDenominator(prev => [...prev, newTerm]);
      }
    },
    [focusedSlot]
  );

  // Once the chip mounts with the initial transform, schedule a rAF to clear
  // the delta — the CSS transition picks up the change and animates to (0, 0).
  useEffect(() => {
    if (flyInKey === null || flyInDelta === null) return;
    const raf = requestAnimationFrame(() => {
      setFlyInDelta(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [flyInKey, flyInDelta]);

  // Clear the fly-in key after the transition completes (220ms ≈ 200ms ease-out
  // + buffer). Safe to clear even if rAF didn't fire (jsdom path).
  useEffect(() => {
    if (flyInKey === null) return;
    const timeout = setTimeout(() => {
      setFlyInKey(null);
    }, 250);
    return () => clearTimeout(timeout);
  }, [flyInKey]);

  const removeTerm = useCallback((slot: SlotId, index: number) => {
    const updater = (prev: FormulaTerm[]) => prev.filter((_, i) => i !== index);
    if (slot === 'numerator') {
      setCustomNumerator(updater);
    } else {
      setCustomDenominator(updater);
    }
  }, []);

  const flipSign = useCallback((slot: SlotId, index: number) => {
    const updater = (prev: FormulaTerm[]): FormulaTerm[] =>
      prev.map((term, i): FormulaTerm => {
        if (i !== index) return term;
        if (term.kind !== 'column') return term;
        const nextSign: '+' | '-' = term.sign === '+' ? '-' : '+';
        return { ...term, sign: nextSign };
      });
    if (slot === 'numerator') {
      setCustomNumerator(updater);
    } else {
      setCustomDenominator(updater);
    }
  }, []);

  const customSaveDisabled = customName.trim().length === 0 || customNumerator.length === 0;

  const handleCustomSave = () => {
    if (customSaveDisabled) return;
    const binding: FormulaBinding = {
      id: crypto.randomUUID(),
      name: customName,
      numerator: customNumerator,
      denominator: customDenominator,
      multiplier: customMultiplier,
      family: 'custom',
    };
    onSave(binding);
  };

  return (
    <div
      data-testid="calc-column-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <FocusTrap
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          fallbackFocus: '[role="dialog"]',
        }}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calc-column-modal-title"
          tabIndex={-1}
          className="bg-surface rounded-xl border border-edge p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <h2 id="calc-column-modal-title" className="text-base font-semibold text-content mb-4">
            Calculate a new column
          </h2>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Calculated column input mode"
            className="flex gap-0 border-b border-edge mb-4"
          >
            <button
              type="button"
              role="tab"
              id="calc-column-tab-templates"
              aria-selected={activeTab === 'templates'}
              aria-controls="calc-column-panel-templates"
              data-testid="calc-column-tab-templates"
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === 'templates'
                  ? 'border-[var(--vs-accent)] text-[var(--vs-accent)] font-semibold'
                  : 'border-transparent text-content-secondary hover:text-content'
              }`}
            >
              Templates
            </button>
            <button
              type="button"
              role="tab"
              id="calc-column-tab-custom"
              aria-selected={activeTab === 'custom'}
              aria-controls="calc-column-panel-custom"
              data-testid="calc-column-tab-custom"
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-px ${
                activeTab === 'custom'
                  ? 'border-[var(--vs-accent)] text-[var(--vs-accent)] font-semibold'
                  : 'border-transparent text-content-secondary hover:text-content'
              }`}
            >
              Custom formula
            </button>
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'templates' ? (
              <div
                role="tabpanel"
                id="calc-column-panel-templates"
                aria-labelledby="calc-column-tab-templates"
              >
                <TemplatesTabContent
                  numericColumns={numericColumns}
                  templateCtx={templateCtx}
                  hasLeadTime={hasLeadTime}
                  batchDetected={batchData !== null}
                  onSelect={handleTemplateSelect}
                />
              </div>
            ) : (
              <div
                role="tabpanel"
                id="calc-column-panel-custom"
                aria-labelledby="calc-column-tab-custom"
              >
                <CustomTabContent
                  numericColumns={numericColumns}
                  name={customName}
                  onNameChange={setCustomName}
                  numerator={customNumerator}
                  denominator={customDenominator}
                  multiplier={customMultiplier}
                  onMultiplierChange={setCustomMultiplier}
                  focusedSlot={focusedSlot}
                  onFocusSlot={setFocusedSlot}
                  onAddToSlot={handleAddToSlot}
                  onRemoveTerm={removeTerm}
                  onFlipSign={flipSign}
                  flyInKey={flyInKey}
                  flyInDelta={flyInDelta}
                  registerPaletteRect={registerPaletteRect}
                  registerSlotRect={registerSlotRect}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-edge">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-content-secondary hover:bg-surface-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'custom' && (
              <button
                type="button"
                onClick={handleCustomSave}
                disabled={customSaveDisabled}
                aria-disabled={customSaveDisabled}
                data-testid="calc-column-custom-save"
                className={`px-4 py-2 text-sm bg-blue-500 text-white rounded-lg transition-colors ${
                  customSaveDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
              >
                {customName.trim().length > 0 ? `Save · "${customName}" →` : 'Save →'}
              </button>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Templates tab content
// ---------------------------------------------------------------------------

/** Family display labels for the template card headers. */
const FAMILY_LABELS: Record<string, string> = {
  batchRatio: 'Batch ratios',
  dpmo: 'Defect metrics',
  throughput: 'Flow & throughput',
  difference: 'Arithmetic',
  custom: 'Custom',
};

const TemplatesTabContent: React.FC<{
  numericColumns: string[];
  templateCtx: TemplateContext;
  hasLeadTime: boolean;
  batchDetected: boolean;
  onSelect: (template: FormulaTemplate) => void;
}> = ({ numericColumns, templateCtx, hasLeadTime, batchDetected, onSelect }) => {
  if (numericColumns.length === 0) {
    return (
      <p data-testid="calc-column-empty-state" className="text-sm text-content-secondary py-6 px-2">
        No numeric columns yet. Paste data with numbers to use calculated columns.
      </p>
    );
  }

  // Filter to templates available in this context, excluding the generic 'custom'
  // template (it belongs to the Custom tab, not the template grid). Throughput
  // is shown even when unavailable so users learn the prerequisite (per
  // feedback_hidden_vs_disabled_cta: disabled-with-actionable-copy beats hidden
  // when the user can act to unlock it — here, by capturing step timings).
  const availableTemplates = FORMULA_TEMPLATES.filter(t => {
    if (t.id === 'custom') return false;
    if (t.id === 'throughput') return true;
    return t.isAvailable(templateCtx);
  });

  if (availableTemplates.length === 0) {
    return (
      <p
        data-testid="calc-column-no-templates"
        className="text-sm text-content-secondary py-6 px-2"
      >
        No templates match your current columns. Use the Custom formula tab to build your own.
      </p>
    );
  }

  return (
    <div data-testid="calc-column-template-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {availableTemplates.map(template => {
        const isRecommended = batchDetected && template.family === 'batchRatio';
        const isThroughput = template.id === 'throughput';
        const isDisabled = isThroughput && !hasLeadTime;
        const familyLabel = FAMILY_LABELS[template.family] ?? template.family;

        if (isDisabled) {
          return (
            <div
              key={template.id}
              data-testid={`calc-column-card-${template.id}`}
              data-template-id={template.id}
              data-recommended={isRecommended ? 'true' : undefined}
              aria-disabled="true"
              title="Capture step timings first"
              className="rounded-lg border border-edge p-4 opacity-50 cursor-not-allowed"
            >
              <TemplateCardBody
                familyLabel={familyLabel}
                label={template.label}
                description={template.description}
                isRecommended={isRecommended}
              />
              <div className="mt-3">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Capture step timings first"
                  data-template-id={template.id}
                  className="text-sm text-content-secondary cursor-not-allowed"
                >
                  Use template →
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={template.id}
            data-testid={`calc-column-card-${template.id}`}
            data-template-id={template.id}
            data-recommended={isRecommended ? 'true' : undefined}
            className={`rounded-lg border p-4 transition-colors ${
              isRecommended
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-edge hover:border-blue-300 hover:bg-surface-secondary'
            }`}
          >
            <TemplateCardBody
              familyLabel={familyLabel}
              label={template.label}
              description={template.description}
              isRecommended={isRecommended}
            />
            <div className="mt-3">
              <button
                type="button"
                role="button"
                data-template-id={template.id}
                onClick={() => onSelect(template)}
                className={`text-sm font-medium transition-colors ${
                  isRecommended
                    ? 'text-emerald-700 hover:text-emerald-800'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Use template →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TemplateCardBody: React.FC<{
  familyLabel: string;
  label: string;
  description: string;
  isRecommended: boolean;
}> = ({ familyLabel, label, description, isRecommended }) => (
  <>
    <p
      className={`text-xs font-medium uppercase tracking-wide mb-1 ${
        isRecommended ? 'text-emerald-700' : 'text-content-secondary'
      }`}
    >
      {familyLabel}
    </p>
    <p className="text-sm font-semibold text-content">{label}</p>
    <p className="text-xs text-content-secondary mt-1">{description}</p>
  </>
);

// ---------------------------------------------------------------------------
// Custom formula tab content (Task 6)
// ---------------------------------------------------------------------------

/**
 * Custom formula builder. Click-to-add UX (NOT drag-and-drop per plan §8):
 * user clicks a slot to focus it, then clicks palette chips to fill the slot.
 * Each slotted chip carries a sign toggle and a remove button.
 *
 * Fly-in animation: when a chip is added we read the palette chip's bounding
 * rect + the slot's bounding rect, compute a transform delta, and mount the
 * new chip with `transform: translate(dx, dy)` + `transition: transform 200ms
 * ease-out`. A rAF clears the delta, the CSS transition picks up the change,
 * and the chip slides into place. In jsdom both rects return zero-sized boxes
 * so the delta is (0, 0) and the animation is a no-op (no jank, no jiggle).
 */
interface CustomTabContentProps {
  numericColumns: string[];
  name: string;
  onNameChange: (name: string) => void;
  numerator: FormulaTerm[];
  denominator: FormulaTerm[];
  multiplier: number;
  onMultiplierChange: (multiplier: number) => void;
  focusedSlot: SlotId | null;
  onFocusSlot: (slot: SlotId) => void;
  onAddToSlot: (column: string) => void;
  onRemoveTerm: (slot: SlotId, index: number) => void;
  onFlipSign: (slot: SlotId, index: number) => void;
  flyInKey: string | null;
  flyInDelta: { dx: number; dy: number } | null;
  registerPaletteRect: (column: string, rect: DOMRect | null) => void;
  registerSlotRect: (slot: SlotId, rect: DOMRect | null) => void;
}

const CustomTabContent: React.FC<CustomTabContentProps> = ({
  numericColumns,
  name,
  onNameChange,
  numerator,
  denominator,
  multiplier,
  onMultiplierChange,
  focusedSlot,
  onFocusSlot,
  onAddToSlot,
  onRemoveTerm,
  onFlipSign,
  flyInKey,
  flyInDelta,
  registerPaletteRect,
  registerSlotRect,
}) => {
  return (
    <div className="flex flex-col gap-4 py-2 px-1">
      {/* Name input */}
      <div>
        <label
          htmlFor="calc-column-custom-name"
          className="block text-xs font-medium text-content-secondary mb-1"
        >
          Column name
        </label>
        <input
          id="calc-column-custom-name"
          type="text"
          aria-label="Calculated column name"
          placeholder="Calculated_column"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          className="w-full text-sm border border-edge rounded-md px-2 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Composer: slots (left) + multiplier (right) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 flex flex-col gap-2">
          <FormulaSlot
            slot="numerator"
            label="Numerator"
            placeholder="Click a column to add to numerator"
            focused={focusedSlot === 'numerator'}
            terms={numerator}
            onFocus={() => onFocusSlot('numerator')}
            onRemove={index => onRemoveTerm('numerator', index)}
            onFlipSign={index => onFlipSign('numerator', index)}
            flyInKey={flyInKey}
            flyInDelta={flyInDelta}
            registerSlotRect={registerSlotRect}
          />
          <div
            aria-hidden="true"
            className="text-center text-content-secondary text-sm select-none"
          >
            ÷
          </div>
          <FormulaSlot
            slot="denominator"
            label="Denominator"
            placeholder="(empty = numerator only)"
            focused={focusedSlot === 'denominator'}
            terms={denominator}
            onFocus={() => onFocusSlot('denominator')}
            onRemove={index => onRemoveTerm('denominator', index)}
            onFlipSign={index => onFlipSign('denominator', index)}
            flyInKey={flyInKey}
            flyInDelta={flyInDelta}
            registerSlotRect={registerSlotRect}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="calc-column-custom-multiplier"
            className="block text-xs font-medium text-content-secondary"
          >
            Multiplier
          </label>
          <input
            id="calc-column-custom-multiplier"
            type="number"
            aria-label="Multiplier"
            value={multiplier}
            onChange={e => {
              const next = Number(e.target.value);
              onMultiplierChange(Number.isFinite(next) ? next : 1);
            }}
            className="w-full text-sm border border-edge rounded-md px-2 py-1.5 bg-surface focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <p className="text-xs text-content-secondary">
            × multiplier (e.g. 100 for %, 1,000,000 for DPMO)
          </p>
        </div>
      </div>

      {/* Palette */}
      <div>
        <p className="text-xs font-medium text-content-secondary mb-1">Columns</p>
        {numericColumns.length === 0 ? (
          <p className="text-sm text-content-secondary py-2">No numeric columns available.</p>
        ) : (
          <div data-testid="calc-column-custom-palette" className="flex flex-wrap gap-2">
            {numericColumns.map(col => (
              <PaletteChip
                key={col}
                column={col}
                onClick={() => onAddToSlot(col)}
                registerRect={registerPaletteRect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface PaletteChipProps {
  column: string;
  onClick: () => void;
  registerRect: (column: string, rect: DOMRect | null) => void;
}

const PaletteChip: React.FC<PaletteChipProps> = ({ column, onClick, registerRect }) => {
  const ref = useRef<HTMLButtonElement>(null);

  // Re-measure on mount + every render. Cheap on the few-chips count Custom
  // tab carries; ensures rect is fresh if layout shifts.
  useEffect(() => {
    registerRect(column, ref.current?.getBoundingClientRect() ?? null);
  });

  return (
    <button
      ref={ref}
      type="button"
      data-palette-chip={column}
      aria-label={column}
      onClick={onClick}
      className="text-xs font-medium px-2 py-1 rounded-md border border-edge bg-surface-secondary text-content hover:bg-blue-50 hover:border-blue-300 transition-colors"
    >
      {column}
    </button>
  );
};

interface FormulaSlotProps {
  slot: SlotId;
  label: string;
  placeholder: string;
  focused: boolean;
  terms: FormulaTerm[];
  onFocus: () => void;
  onRemove: (index: number) => void;
  onFlipSign: (index: number) => void;
  flyInKey: string | null;
  flyInDelta: { dx: number; dy: number } | null;
  registerSlotRect: (slot: SlotId, rect: DOMRect | null) => void;
}

const FormulaSlot: React.FC<FormulaSlotProps> = ({
  slot,
  label,
  placeholder,
  focused,
  terms,
  onFocus,
  onRemove,
  onFlipSign,
  flyInKey,
  flyInDelta,
  registerSlotRect,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerSlotRect(slot, ref.current?.getBoundingClientRect() ?? null);
  });

  // The newest term (last in the array) is the one that may carry the fly-in
  // initial transform. Apply to the LAST chip rendered iff flyInKey starts
  // with this slot's name AND flyInDelta is still set (i.e. rAF hasn't cleared
  // it yet). We don't need stable per-term IDs for V1 — the last-in-array
  // chip is the only animation target.
  const isFlyInTargetForThisSlot =
    flyInKey !== null && flyInKey.startsWith(`${slot}:`) && flyInDelta !== null;

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      data-slot={slot}
      data-focused={focused}
      onClick={onFocus}
      className={`min-h-[44px] rounded-md border-2 px-3 py-2 cursor-text transition-colors ${
        focused ? 'border-blue-400 bg-blue-50' : 'border-edge bg-surface-secondary'
      }`}
    >
      {terms.length === 0 ? (
        <p className="text-xs text-content-secondary select-none">{placeholder}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {terms.map((term, index) => {
            const isLast = index === terms.length - 1;
            const applyFlyIn = isLast && isFlyInTargetForThisSlot && flyInDelta;
            const style: React.CSSProperties = applyFlyIn
              ? {
                  transform: `translate(${flyInDelta!.dx}px, ${flyInDelta!.dy}px)`,
                  transition: 'transform 200ms ease-out',
                }
              : { transform: 'translate(0, 0)', transition: 'transform 200ms ease-out' };

            if (term.kind === 'constant') {
              return (
                <span
                  key={index}
                  data-term-kind="constant"
                  style={style}
                  className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md bg-surface border border-edge text-content"
                >
                  {term.value}
                </span>
              );
            }

            return (
              <span
                key={index}
                data-term-kind="column"
                style={style}
                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md bg-surface border border-edge text-content"
              >
                <button
                  type="button"
                  data-sign-toggle={index}
                  data-testid={`calc-column-sign-toggle-${slot}-${index}`}
                  aria-label={`Toggle sign for ${term.column}`}
                  onClick={e => {
                    e.stopPropagation();
                    onFlipSign(index);
                  }}
                  className="font-mono text-content-secondary hover:text-content"
                >
                  {term.sign}
                </button>
                <span>{term.column}</span>
                <button
                  type="button"
                  data-remove-term={index}
                  aria-label={`Remove ${term.column}`}
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="text-content-secondary hover:text-red-600"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
