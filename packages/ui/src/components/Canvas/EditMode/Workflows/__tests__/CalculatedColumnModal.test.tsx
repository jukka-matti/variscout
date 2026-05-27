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
      rows={[]}
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

    it('clicking a template card button calls onSave with a FormulaBinding', () => {
      const { onSave } = renderModal({ rawProfiles: [numericProfile('A'), numericProfile('B')] });
      const dpmoCard = screen.getByTestId('calc-column-card-dpmo');
      const dpmoBtn = within(dpmoCard).getByRole('button', { name: /use template/i });
      fireEvent.click(dpmoBtn);
      expect(onSave).toHaveBeenCalledOnce();
      const binding = onSave.mock.calls[0][0];
      expect(binding).toHaveProperty('id');
      expect(binding).toHaveProperty('name', 'DPMO');
      expect(binding).toHaveProperty('family', 'dpmo');
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

  describe('Custom formula tab placeholder', () => {
    it('shows placeholder text when Custom formula tab is active', () => {
      renderModal();
      fireEvent.click(screen.getByTestId('calc-column-tab-custom'));
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'calc-column-panel-custom');
      expect(screen.getByTestId('calc-column-custom-placeholder')).toBeInTheDocument();
      expect(screen.getByText(/custom formula builder.*task 6/i)).toBeInTheDocument();
    });
  });
});
