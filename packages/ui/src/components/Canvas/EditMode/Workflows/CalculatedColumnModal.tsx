import React, { useState, useEffect, useRef, useMemo } from 'react';
import FocusTrap from 'focus-trap-react';
import type { FormulaBinding, FormulaTemplate, TemplateContext } from '@variscout/core';
import { FORMULA_TEMPLATES, detectBatchData } from '@variscout/core';
import type { ColumnParsingProfile } from '@variscout/core/parser';

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
                <CustomTabPlaceholder />
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
// Custom formula tab placeholder
// ---------------------------------------------------------------------------

/**
 * Placeholder panel for Task 6.
 *
 * Task 6 should replace the inner content with the formula builder UI.
 * The panel's role="tabpanel" wrapper lives in the parent (CalculatedColumnModal),
 * so Task 6 only needs to replace this component's returned JSX.
 */
const CustomTabPlaceholder: React.FC = () => (
  <div data-testid="calc-column-custom-placeholder" className="py-6 px-2">
    <p className="text-sm text-content-secondary">Custom formula builder — coming in Task 6</p>
  </div>
);
