/**
 * Tests for CalculatedColumnModal — D2 Task 5 (modal skeleton + Templates tab card grid).
 *
 * Task 5 scope:
 * - FocusTrap shell with backdrop + Escape/click-outside close (mirror StepTimingsModal).
 * - role="dialog" + aria-modal + aria-labelledby pointing at the heading.
 * - Header copy: "Calculate a new column".
 * - Tabs: "Templates" (default, aria-selected="true") + "Custom formula" (present).
 * - Tab buttons have id + matching panels have aria-labelledby.
 * - Templates tab: card grid filtered by template.isAvailable(ctx).
 * - Each card: family label, description, "Use template →" button with data-template-id.
 * - Throughput card disabled when hasLeadTime=false; active when hasLeadTime=true.
 * - Batch-detected templates highlighted with data-recommended="true".
 * - Empty state when no numeric columns.
 * - Custom tab: placeholder text.
 * - Tab switching: aria-selected flips; panel content swaps.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ColumnParsingProfile } from '@variscout/core/parser';
import { FORMULA_TEMPLATES } from '@variscout/core';
import { CalculatedColumnModal } from '../CalculatedColumnModal';
import { createTestColumnParsingProfile } from '../../../../../test-utils/columnParsingProfile';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a minimal numeric-kind ColumnParsingProfile. */
function numericProfile(columnName: string): ColumnParsingProfile {
  return createTestColumnParsingProfile({
    columnName,
    primary: { kind: 'numeric', label: 'numeric · plain', detail: {} },
  });
}

/** Build a minimal date-kind ColumnParsingProfile. */
function dateProfile(columnName: string): ColumnParsingProfile {
  return createTestColumnParsingProfile({
    columnName,
    primary: { kind: 'date', label: 'date · ISO', detail: {} },
  });
}

/**
 * Build a set of batch-data profiles that will trigger detectBatchData:
 * Input_kg (numeric) + GradeA_kg (numeric).
 */
function batchProfiles(): ColumnParsingProfile[] {
  return [numericProfile('Input_kg'), numericProfile('GradeA_kg')];
}

interface RenderOptions {
  sourceColumn?: string;
  rawProfiles?: ColumnParsingProfile[];
  numericValuesByColumn?: Record<string, number[]>;
  rows?: ReadonlyArray<Record<string, unknown>>;
  hasLeadTime?: boolean;
  existingDerivedNames?: string[];
}

function renderModal(opts: RenderOptions = {}) {
  const onSave = vi.fn();
  const onClose = vi.fn();

  const rawProfiles = opts.rawProfiles ?? [numericProfile('A'), numericProfile('B')];
  const numericValuesByColumn =
    opts.numericValuesByColumn ??
    Object.fromEntries(
      rawProfiles.filter(p => p.primary?.kind === 'numeric').map(p => [p.columnName, [1, 2, 3]])
    );

  const utils = render(
    <CalculatedColumnModal
      sourceColumn={opts.sourceColumn}
      rawProfiles={rawProfiles}
      numericValuesByColumn={numericValuesByColumn}
      rows={opts.rows ?? []}
      hasLeadTime={opts.hasLeadTime ?? false}
      existingDerivedNames={opts.existingDerivedNames ?? []}
      onSave={onSave}
      onClose={onClose}
    />
  );

  return { ...utils, onSave, onClose };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CalculatedColumnModal', () => {
  describe('dialog shell + accessibility', () => {
    it('renders dialog role with aria-modal and aria-labelledby pointing at the heading', () => {
      renderModal();
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBe('calc-column-modal-title');
      const heading = document.getElementById(labelId!);
      expect(heading).toBeTruthy();
      expect(heading!.textContent).toBe('Calculate a new column');
    });

    it('renders h2 with id="calc-column-modal-title" and correct copy', () => {
      renderModal();
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveAttribute('id', 'calc-column-modal-title');
      expect(h2).toHaveTextContent('Calculate a new column');
    });

    it('renders backdrop element', () => {
      renderModal();
      expect(screen.getByTestId('calc-column-backdrop')).toBeInTheDocument();
    });
  });

  describe('close handlers', () => {
    it('calls onClose when Escape is pressed', () => {
      const { onClose } = renderModal();
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when backdrop is clicked', () => {
      const { onClose } = renderModal();
      const backdrop = screen.getByTestId('calc-column-backdrop');
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('does NOT call onClose when the modal interior is clicked', () => {
      const { onClose } = renderModal();
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('tab structure', () => {
    it('renders tablist with aria-label', () => {
      renderModal();
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Calculated column input mode');
    });

    it('renders two tabs: Templates (default active) and Custom formula', () => {
      renderModal();
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      const [templatesTab, customTab] = tabs;
      expect(templatesTab).toHaveTextContent('Templates');
      expect(templatesTab).toHaveAttribute('aria-selected', 'true');
      expect(customTab).toHaveTextContent('Custom formula');
      expect(customTab).toHaveAttribute('aria-selected', 'false');
    });

    it('tab buttons have id attributes', () => {
      renderModal();
      const templatesTab = screen.getByTestId('calc-column-tab-templates');
      const customTab = screen.getByTestId('calc-column-tab-custom');
      expect(templatesTab).toHaveAttribute('id', 'calc-column-tab-templates');
      expect(customTab).toHaveAttribute('id', 'calc-column-tab-custom');
    });

    it('tab panels have aria-labelledby matching the tab ids', () => {
      renderModal();
      // Templates panel is visible by default
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'calc-column-tab-templates');
      expect(panel).toHaveAttribute('id', 'calc-column-panel-templates');
    });
  });

  describe('Templates tab is default active', () => {
    it('Templates tab has aria-selected="true" on mount', () => {
      renderModal();
      const templatesTab = screen.getByTestId('calc-column-tab-templates');
      expect(templatesTab).toHaveAttribute('aria-selected', 'true');
    });

    it('Custom formula tab has aria-selected="false" on mount', () => {
      renderModal();
      const customTab = screen.getByTestId('calc-column-tab-custom');
      expect(customTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('tab switching', () => {
    it('clicking Custom formula tab flips aria-selected and shows custom panel', () => {
      renderModal();
      const customTab = screen.getByTestId('calc-column-tab-custom');
      fireEvent.click(customTab);

      expect(customTab).toHaveAttribute('aria-selected', 'true');
      const templatesTab = screen.getByTestId('calc-column-tab-templates');
      expect(templatesTab).toHaveAttribute('aria-selected', 'false');

      // Templates content should be gone, custom panel should be present
      expect(screen.queryByTestId('calc-column-template-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('calc-column-empty-state')).not.toBeInTheDocument();
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'calc-column-panel-custom');
    });
  });

  describe('Templates tab — card grid', () => {
    it('renders cards for templates whose isAvailable() returns true', () => {
      // With two numeric columns, "difference" + "dpmo" + "custom" (always) should be available.
      // "batchRatio" templates need batch profiles; "throughput" needs hasLeadTime.
      // We use the default 2-numeric-column setup (no batch profiles, no lead time).
      renderModal({ rawProfiles: [numericProfile('A'), numericProfile('B')] });

      // Should have a grid
      expect(screen.getByTestId('calc-column-template-grid')).toBeInTheDocument();

      // DPMO is always available (isAvailable: () => true), difference needs >= 2 cols
      // Both should appear; batchRatio templates need batch data (absent here)
      expect(screen.queryByTestId('calc-column-card-dpmo')).toBeInTheDocument();
      expect(screen.queryByTestId('calc-column-card-difference')).toBeInTheDocument();
      // batchRatio cards should NOT appear (no batch profiles)
      expect(
        screen.queryByTestId('calc-column-card-batchRatio.totalYield')
      ).not.toBeInTheDocument();
      // throughput appears even when hasLeadTime=false — rendered as disabled
      // with "Capture step timings first" tooltip so users learn the prerequisite
      expect(screen.queryByTestId('calc-column-card-throughput')).toBeInTheDocument();
    });

    it('each visible card has family label, description, and "Use template →" button', () => {
      renderModal({ rawProfiles: [numericProfile('A'), numericProfile('B')] });
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      // Family label
      expect(within(dpmoCard).getByText('Defect metrics')).toBeInTheDocument();
      // Description (non-empty text from FORMULA_TEMPLATES)
      const dpmoTemplate = FORMULA_TEMPLATES.find(t => t.id === 'dpmo')!;
      expect(within(dpmoCard).getByText(dpmoTemplate.description)).toBeInTheDocument();
      // CTA button
      const btn = within(dpmoCard).getByRole('button', { name: /use template/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('data-template-id', 'dpmo');
    });

    it('card buttons have unique data-template-id attributes', () => {
      renderModal({ rawProfiles: [numericProfile('A'), numericProfile('B')] });
      const allButtons = screen.getAllByRole('button', { name: /use template/i });
      const ids = allButtons.map(btn => btn.getAttribute('data-template-id'));
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('clicking a template card button pre-fills Custom tab and switches to it', () => {
      const { onSave } = renderModal({
        rawProfiles: [numericProfile('Defects'), numericProfile('Samples')],
        numericValuesByColumn: { Defects: [3, 6, 9], Samples: [100, 200, 300] },
      });
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      const dpmoBtn = within(dpmoCard).getByRole('button', { name: /use template/i });
      fireEvent.click(dpmoBtn);

      // onSave NOT called — user reviews in Custom tab first
      expect(onSave).not.toHaveBeenCalled();

      // Custom tab is now active
      const customTab = screen.getByTestId('calc-column-tab-custom');
      expect(customTab).toHaveAttribute('aria-selected', 'true');

      // Name pre-filled
      const nameInput = screen.getByLabelText('Calculated column name') as HTMLInputElement;
      expect(nameInput.value).toBe('DPMO');

      // Multiplier pre-filled to 1,000,000
      const multiplierInput = screen.getByLabelText('Multiplier') as HTMLInputElement;
      expect(Number(multiplierInput.value)).toBe(1_000_000);
    });
  });

  describe('Throughput card disabled when no Lead_time', () => {
    it('throughput card is rendered disabled with tooltip when hasLeadTime=false', () => {
      renderModal({
        rawProfiles: [numericProfile('A'), numericProfile('B')],
        hasLeadTime: false,
      });
      const card = screen.getByTestId('calc-column-card-throughput');
      expect(card).toHaveAttribute('aria-disabled', 'true');
      expect(card).toHaveAttribute('title', 'Capture step timings first');
      // Card's CTA button is disabled — clicking does not invoke onSave
      const btn = within(card).getByRole('button', { name: /use template/i });
      expect(btn).toBeDisabled();
    });

    it('throughput disabled card does not call onSave when clicked', () => {
      const { onSave } = renderModal({
        rawProfiles: [numericProfile('A'), numericProfile('B')],
        hasLeadTime: false,
      });
      const card = screen.getByTestId('calc-column-card-throughput');
      const btn = within(card).getByRole('button', { name: /use template/i });
      fireEvent.click(btn);
      expect(onSave).not.toHaveBeenCalled();
    });

    it('throughput card is present and active when hasLeadTime=true', () => {
      renderModal({
        rawProfiles: [numericProfile('A'), numericProfile('B'), numericProfile('Lead_time')],
        numericValuesByColumn: { A: [1, 2], B: [3, 4], Lead_time: [5, 6] },
        hasLeadTime: true,
      });
      const card = screen.getByTestId('calc-column-card-throughput');
      expect(card).not.toHaveAttribute('aria-disabled', 'true');
      const btn = within(card).getByRole('button', { name: /use template/i });
      expect(btn).not.toBeDisabled();
      expect(btn).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('batch detection highlight', () => {
    it('batch ratio cards have data-recommended="true" when detectBatchData returns non-null', () => {
      // Use batch profiles: Input_kg (numeric input) + GradeA_kg (numeric output)
      const profiles = batchProfiles();
      const numericValues: Record<string, number[]> = {
        Input_kg: [100, 110],
        GradeA_kg: [80, 90],
      };
      renderModal({ rawProfiles: profiles, numericValuesByColumn: numericValues });

      // batchRatio.totalYield should be present and recommended
      const totalYieldCard = screen.queryByTestId('calc-column-card-batchRatio.totalYield');
      expect(totalYieldCard).toBeInTheDocument();
      expect(totalYieldCard).toHaveAttribute('data-recommended', 'true');

      // batchRatio.gradeA should also be recommended
      const gradeACard = screen.queryByTestId('calc-column-card-batchRatio.gradeA');
      expect(gradeACard).toBeInTheDocument();
      expect(gradeACard).toHaveAttribute('data-recommended', 'true');
    });

    it('batch ratio cards do NOT have data-recommended when detectBatchData returns null', () => {
      // Generic profiles without batch naming → detectBatchData returns null
      renderModal({
        rawProfiles: [numericProfile('A'), numericProfile('B')],
        numericValuesByColumn: { A: [1, 2], B: [3, 4] },
      });

      // DPMO card should exist but NOT be recommended (different family)
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      expect(dpmoCard).not.toHaveAttribute('data-recommended', 'true');
    });
  });

  describe('empty state when no numeric columns', () => {
    it('renders empty-state copy when rawProfiles is empty and numericValuesByColumn is empty', () => {
      renderModal({ rawProfiles: [], numericValuesByColumn: {} });
      expect(screen.getByTestId('calc-column-empty-state')).toHaveTextContent(
        'No numeric columns yet. Paste data with numbers to use calculated columns.'
      );
      expect(screen.queryByTestId('calc-column-template-grid')).not.toBeInTheDocument();
    });

    it('renders empty-state copy when only date profiles are provided', () => {
      renderModal({
        rawProfiles: [dateProfile('Start_date'), dateProfile('End_date')],
        numericValuesByColumn: {},
      });
      expect(screen.getByTestId('calc-column-empty-state')).toBeInTheDocument();
    });
  });

  describe('Custom formula tab', () => {
    /** Helper: open the Custom tab. Returns the same `utils` shape. */
    function openCustomTab(opts: RenderOptions = {}) {
      const utils = renderModal(opts);
      fireEvent.click(screen.getByTestId('calc-column-tab-custom'));
      return utils;
    }

    it('renders empty slots + multiplier + name input on Custom tab', () => {
      openCustomTab();

      // Numerator slot
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      expect(numerator).toBeInTheDocument();
      expect(numerator).toHaveAttribute('data-slot', 'numerator');
      expect(numerator).toHaveTextContent(/click a column to add to numerator/i);

      // Denominator slot
      const denominator = screen.getByRole('group', { name: 'Denominator' });
      expect(denominator).toBeInTheDocument();
      expect(denominator).toHaveAttribute('data-slot', 'denominator');
      expect(denominator).toHaveTextContent(/empty = numerator only/i);

      // Multiplier input (default value 1)
      const multiplier = screen.getByLabelText('Multiplier') as HTMLInputElement;
      expect(multiplier).toBeInTheDocument();
      expect(multiplier.value).toBe('1');

      // Name input
      const nameInput = screen.getByLabelText('Calculated column name') as HTMLInputElement;
      expect(nameInput).toBeInTheDocument();
      expect(nameInput.value).toBe('');

      // Save button visible and disabled (name empty + numerator empty)
      const save = screen.getByTestId('calc-column-custom-save');
      expect(save).toBeInTheDocument();
      expect(save).toBeDisabled();
    });

    it('side palette lists numeric columns as palette chips', () => {
      openCustomTab({
        rawProfiles: [numericProfile('A'), numericProfile('B'), numericProfile('Lead_time')],
        numericValuesByColumn: { A: [1, 2], B: [3, 4], Lead_time: [5, 6] },
      });

      const aChip = screen.getByRole('button', { name: 'A' });
      const bChip = screen.getByRole('button', { name: 'B' });
      const leadChip = screen.getByRole('button', { name: 'Lead_time' });

      expect(aChip).toHaveAttribute('data-palette-chip', 'A');
      expect(bChip).toHaveAttribute('data-palette-chip', 'B');
      expect(leadChip).toHaveAttribute('data-palette-chip', 'Lead_time');
    });

    it('clicking palette chip with numerator focused → term added to numerator', () => {
      openCustomTab();

      // Focus numerator slot
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      fireEvent.click(numerator);
      expect(numerator).toHaveAttribute('data-focused', 'true');

      // Click palette chip A
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      // Numerator now contains the chip
      const slottedA = within(numerator).getByText(/A/);
      expect(slottedA).toBeInTheDocument();

      // Remove (×) button present
      const removeBtn = within(numerator).getByRole('button', { name: /remove A/i });
      expect(removeBtn).toBeInTheDocument();
    });

    it('clicking palette chip with no slot focused → numerator focused + chip added', () => {
      openCustomTab();

      const numerator = screen.getByRole('group', { name: 'Numerator' });
      expect(numerator).toHaveAttribute('data-focused', 'false');

      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      // Numerator now focused AND contains A
      expect(numerator).toHaveAttribute('data-focused', 'true');
      const removeBtn = within(numerator).getByRole('button', { name: /remove A/i });
      expect(removeBtn).toBeInTheDocument();
    });

    it('clicking palette chip with denominator focused → term added to denominator', () => {
      openCustomTab();

      const denominator = screen.getByRole('group', { name: 'Denominator' });
      fireEvent.click(denominator);
      expect(denominator).toHaveAttribute('data-focused', 'true');

      fireEvent.click(screen.getByRole('button', { name: 'B' }));

      const removeBtn = within(denominator).getByRole('button', { name: /remove B/i });
      expect(removeBtn).toBeInTheDocument();
    });

    it('clicking × on a slotted chip removes the term and restores placeholder', () => {
      openCustomTab();

      // Add A to numerator
      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      expect(within(numerator).queryByRole('button', { name: /remove A/i })).toBeInTheDocument();

      // Click remove
      fireEvent.click(within(numerator).getByRole('button', { name: /remove A/i }));

      // Term gone; placeholder reappears
      expect(
        within(numerator).queryByRole('button', { name: /remove A/i })
      ).not.toBeInTheDocument();
      expect(numerator).toHaveTextContent(/click a column to add to numerator/i);
    });

    it('clicking sign toggle on a slotted chip flips + ↔ -', () => {
      openCustomTab();

      // Add A to numerator (default sign is +)
      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      const signBtn = within(numerator).getByTestId('calc-column-sign-toggle-numerator-0');
      expect(signBtn).toHaveTextContent('+');

      // Click sign toggle
      fireEvent.click(signBtn);

      // Sign now -
      expect(signBtn).toHaveTextContent('-');
    });

    it('multiplier input updates state', () => {
      openCustomTab();
      const multiplier = screen.getByLabelText('Multiplier') as HTMLInputElement;
      expect(multiplier.value).toBe('1');

      fireEvent.change(multiplier, { target: { value: '100' } });
      expect(multiplier.value).toBe('100');

      fireEvent.change(multiplier, { target: { value: '1000000' } });
      expect(multiplier.value).toBe('1000000');
    });

    it('name input updates Save button label', () => {
      openCustomTab();

      // Add A so name-empty is the only blocker → save label changes once name is set
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      const nameInput = screen.getByLabelText('Calculated column name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Yield_pct' } });

      const save = screen.getByTestId('calc-column-custom-save');
      expect(save).toHaveTextContent('Save · "Yield_pct" →');
    });

    it('Save button is disabled when name is empty (even if numerator has terms)', () => {
      openCustomTab();

      // Add A — name still empty
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      const save = screen.getByTestId('calc-column-custom-save');
      expect(save).toBeDisabled();
    });

    it('Save button is disabled when numerator is empty (even if name is set)', () => {
      openCustomTab();

      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Foo' } });

      const save = screen.getByTestId('calc-column-custom-save');
      expect(save).toBeDisabled();
    });

    it('Save calls onSave with a custom FormulaBinding', () => {
      const { onSave } = openCustomTab();

      // Name
      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Yield_pct' } });

      // Numerator A
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      // Denominator B
      const denominator = screen.getByRole('group', { name: 'Denominator' });
      fireEvent.click(denominator);
      fireEvent.click(screen.getByRole('button', { name: 'B' }));

      // Multiplier 100
      const multiplier = screen.getByLabelText('Multiplier');
      fireEvent.change(multiplier, { target: { value: '100' } });

      // Save
      fireEvent.click(screen.getByTestId('calc-column-custom-save'));

      expect(onSave).toHaveBeenCalledOnce();
      const binding = onSave.mock.calls[0][0];
      expect(binding).toMatchObject({
        name: 'Yield_pct',
        numerator: [{ kind: 'column', column: 'A', sign: '+' }],
        denominator: [{ kind: 'column', column: 'B', sign: '+' }],
        multiplier: 100,
        family: 'custom',
      });
      expect(binding.id).toBeTruthy();
      expect(binding.templateId).toBeUndefined();
    });

    it('Cancel button on Custom tab calls onClose (not onSave)', () => {
      const { onClose, onSave } = openCustomTab();
      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(onClose).toHaveBeenCalledOnce();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('Tab switching preserves Custom tab state', () => {
      openCustomTab();

      // Add A to numerator, type name "Foo"
      fireEvent.click(screen.getByRole('button', { name: 'A' }));
      const nameInput = screen.getByLabelText('Calculated column name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Foo' } });

      // Switch to Templates tab
      fireEvent.click(screen.getByTestId('calc-column-tab-templates'));
      expect(screen.queryByLabelText('Calculated column name')).not.toBeInTheDocument();

      // Switch back to Custom
      fireEvent.click(screen.getByTestId('calc-column-tab-custom'));

      // State preserved
      const nameAfter = screen.getByLabelText('Calculated column name') as HTMLInputElement;
      expect(nameAfter.value).toBe('Foo');
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      expect(within(numerator).queryByRole('button', { name: /remove A/i })).toBeInTheDocument();
    });

    it('no constant chips render when terms array is empty', () => {
      openCustomTab();

      // No element should have data-term-kind="constant"
      expect(document.querySelector('[data-term-kind="constant"]')).toBeNull();
    });

    // -------------------------------------------------------------------------
    // Task 7: template pre-fill + live preview + parse-success counts
    // -------------------------------------------------------------------------

    it('live preview section is absent when numerator is empty', () => {
      openCustomTab();
      expect(screen.queryByTestId('calc-column-live-preview')).not.toBeInTheDocument();
    });

    it('live preview shows sample rows after pre-filling from template', () => {
      const rows = [
        { Defects: 3, Samples: 100 },
        { Defects: 6, Samples: 200 },
        { Defects: 9, Samples: 300 },
      ];
      renderModal({
        rawProfiles: [numericProfile('Defects'), numericProfile('Samples')],
        numericValuesByColumn: { Defects: [3, 6, 9], Samples: [100, 200, 300] },
        rows,
      });

      // Click DPMO template → switches to Custom tab with pre-filled state
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      const dpmoBtn = within(dpmoCard).getByRole('button', { name: /use template/i });
      fireEvent.click(dpmoBtn);

      // Live preview region present
      const preview = screen.getByTestId('calc-column-live-preview');
      expect(preview).toBeInTheDocument();

      // Row 1: 3 / 100 × 1,000,000 = 30,000
      const row0 = screen.getByTestId('calc-column-preview-row-0');
      expect(row0.textContent).toContain('Row 1:');
      expect(row0.textContent).toContain('30,000');

      // Row 2: 6 / 200 × 1,000,000 = 30,000
      const row1 = screen.getByTestId('calc-column-preview-row-1');
      expect(row1.textContent).toContain('Row 2:');
      expect(row1.textContent).toContain('30,000');

      // Maximum 3 rows shown (no row index 3+)
      expect(screen.queryByTestId('calc-column-preview-row-3')).not.toBeInTheDocument();
    });

    it('parse-success counts correctly classifies finite / div-by-zero / missing', () => {
      // 3 valid rows + 2 div-by-zero rows + 1 missing cell.
      // numericValuesByColumn (augmented) Samples array is only 5 entries, so
      // index 5 falls out-of-bounds and the evaluator returns NaN for "missing".
      const rows: Array<Record<string, unknown>> = [
        { Defects: 3, Samples: 100 },
        { Defects: 6, Samples: 200 },
        { Defects: 9, Samples: 300 },
        { Defects: 1, Samples: 0 }, // div-by-zero
        { Defects: 2, Samples: 0 }, // div-by-zero
        { Defects: 5 }, // missing Samples (not in row, augmented OOB)
      ];
      renderModal({
        rawProfiles: [numericProfile('Defects'), numericProfile('Samples')],
        numericValuesByColumn: {
          Defects: [3, 6, 9, 1, 2, 5],
          Samples: [100, 200, 300, 0, 0], // 5 entries — index 5 is out-of-bounds
        },
        rows,
      });

      // Click DPMO template
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      fireEvent.click(within(dpmoCard).getByRole('button', { name: /use template/i }));

      const counts = screen.getByTestId('calc-column-parse-success-counts');
      expect(counts.textContent).toContain('3 / 6 rows compute');

      expect(screen.getByTestId('calc-column-divbyzero').textContent).toContain(
        '2 rows with division by zero'
      );
      expect(screen.getByTestId('calc-column-missing').textContent).toContain(
        '1 rows with missing cells'
      );
    });

    it('round-trip via template + save preserves templateId + family', () => {
      const { onSave } = renderModal({
        rawProfiles: [numericProfile('Defects'), numericProfile('Samples')],
        numericValuesByColumn: { Defects: [3], Samples: [100] },
      });

      // Click DPMO template → Custom tab
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      fireEvent.click(within(dpmoCard).getByRole('button', { name: /use template/i }));

      // Save without editing
      fireEvent.click(screen.getByTestId('calc-column-custom-save'));

      expect(onSave).toHaveBeenCalledOnce();
      const binding = onSave.mock.calls[0][0];
      expect(binding.templateId).toBe('dpmo');
      expect(binding.family).toBe('dpmo');
    });

    it('pure custom save (no template): templateId undefined, family custom', () => {
      const { onSave } = openCustomTab();

      // Add A to numerator
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      // Type name
      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Foo' } });

      // Save
      fireEvent.click(screen.getByTestId('calc-column-custom-save'));

      expect(onSave).toHaveBeenCalledOnce();
      const binding = onSave.mock.calls[0][0];
      expect(binding.templateId).toBeUndefined();
      expect(binding.family).toBe('custom');
    });

    it('round-trip via template + edit terms then save — templateId sticky', () => {
      const { onSave } = renderModal({
        rawProfiles: [numericProfile('Defects'), numericProfile('Samples'), numericProfile('A')],
        numericValuesByColumn: { Defects: [3], Samples: [100], A: [1] },
      });

      // Click DPMO template
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      fireEvent.click(within(dpmoCard).getByRole('button', { name: /use template/i }));

      // Edit: add A to numerator slot (extra term)
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      fireEvent.click(numerator);
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      // Save
      fireEvent.click(screen.getByTestId('calc-column-custom-save'));

      expect(onSave).toHaveBeenCalledOnce();
      const binding = onSave.mock.calls[0][0];
      // templateId stays sticky even after editing terms
      expect(binding.templateId).toBe('dpmo');
      expect(binding.family).toBe('dpmo');
    });

    it('live preview hidden when numerator is cleared after pre-fill', () => {
      const rows = [{ Defects: 3, Samples: 100 }];
      renderModal({
        rawProfiles: [numericProfile('Defects'), numericProfile('Samples')],
        numericValuesByColumn: { Defects: [3], Samples: [100] },
        rows,
      });

      // Pre-fill from DPMO template
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      fireEvent.click(within(dpmoCard).getByRole('button', { name: /use template/i }));

      // Live preview should be visible (numerator has terms)
      expect(screen.getByTestId('calc-column-live-preview')).toBeInTheDocument();

      // Remove the Defects term from numerator
      const numerator = screen.getByRole('group', { name: 'Numerator' });
      const removeBtn = within(numerator).getByRole('button', { name: /remove Defects/i });
      fireEvent.click(removeBtn);

      // Live preview should be gone (numerator empty)
      expect(screen.queryByTestId('calc-column-live-preview')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Task 8 polish — name validation + empty states
  // ---------------------------------------------------------------------------

  describe('Task 8 polish — name validation + empty states', () => {
    /** Helper: open the Custom tab. */
    function openCustomTab(opts: RenderOptions = {}) {
      const utils = renderModal(opts);
      fireEvent.click(screen.getByTestId('calc-column-tab-custom'));
      return utils;
    }

    it('Save disabled when name duplicates an existing derived column', () => {
      openCustomTab({ existingDerivedNames: ['Yield_pct', 'Lead_time'] });

      // Add A to numerator so numerator is not empty
      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      // Type the duplicate name
      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Yield_pct' } });

      // Save button should be disabled
      const save = screen.getByTestId('calc-column-custom-save');
      expect(save).toBeDisabled();

      // Inline error visible
      const error = screen.getByTestId('calc-column-name-error');
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent('Name already used');
      expect(error).toHaveAttribute('role', 'alert');

      // aria-invalid + aria-describedby on the name input
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby', 'calc-column-name-error');
    });

    it('Save enabled with a non-duplicate name; no error shown', () => {
      openCustomTab({ existingDerivedNames: ['Yield_pct', 'Lead_time'] });

      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Yield_pct_new' } });

      const save = screen.getByTestId('calc-column-custom-save');
      expect(save).not.toBeDisabled();
      expect(screen.queryByTestId('calc-column-name-error')).not.toBeInTheDocument();
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('duplicate guard trims whitespace: trailing space matches', () => {
      openCustomTab({ existingDerivedNames: ['Yield_pct'] });

      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Yield_pct ' } });

      // Trailing-space input trims to 'Yield_pct' → duplicate detected
      expect(screen.getByTestId('calc-column-name-error')).toBeInTheDocument();
      expect(screen.getByTestId('calc-column-custom-save')).toBeDisabled();
    });

    it('duplicate guard is case-sensitive: different case is NOT a duplicate', () => {
      openCustomTab({ existingDerivedNames: ['Yield_pct'] });

      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'yield_pct' } });

      // Different case → not a duplicate → no error, save enabled
      expect(screen.queryByTestId('calc-column-name-error')).not.toBeInTheDocument();
      expect(screen.getByTestId('calc-column-custom-save')).not.toBeDisabled();
    });

    it('Save disabled when name is empty even if not a duplicate; no error message shown', () => {
      openCustomTab({ existingDerivedNames: ['X'] });

      fireEvent.click(screen.getByRole('button', { name: 'A' }));

      const nameInput = screen.getByLabelText('Calculated column name');
      // Name is empty string — not a duplicate, but invalid
      fireEvent.change(nameInput, { target: { value: '' } });

      expect(screen.getByTestId('calc-column-custom-save')).toBeDisabled();
      // No duplicate-name error shown for empty input
      expect(screen.queryByTestId('calc-column-name-error')).not.toBeInTheDocument();
    });

    it('Save disabled when numerator is empty even if name is unique; no error shown', () => {
      openCustomTab({ existingDerivedNames: ['X'] });

      // Type a unique name but do NOT add numerator terms
      const nameInput = screen.getByLabelText('Calculated column name');
      fireEvent.change(nameInput, { target: { value: 'Foo' } });

      expect(screen.getByTestId('calc-column-custom-save')).toBeDisabled();
      expect(screen.queryByTestId('calc-column-name-error')).not.toBeInTheDocument();
    });

    it('Templates tab shows empty-state copy when no numeric columns are present', () => {
      renderModal({ rawProfiles: [dateProfile('Created')], numericValuesByColumn: {} });

      // Templates tab is active by default
      const emptyState = screen.getByTestId('calc-column-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(screen.queryByTestId('calc-column-template-grid')).not.toBeInTheDocument();
    });

    it('Templates empty-state copy matches the canonical wording exactly', () => {
      renderModal({ rawProfiles: [], numericValuesByColumn: {} });
      const emptyState = screen.getByTestId('calc-column-empty-state');
      expect(emptyState).toHaveTextContent(
        'No numeric columns yet. Paste data with numbers to use calculated columns.'
      );
    });
  });
});
