import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionLineGlanceMigrationModal } from '../ProductionLineGlanceMigrationModal';
import type { ProductionLineGlanceMigrationModalEntry } from '../ProductionLineGlanceMigrationModal';

const entries: ProductionLineGlanceMigrationModalEntry[] = [
  {
    investigationId: 'i1',
    investigationName: 'Coffee Moisture',
    measurementColumn: 'moisture',
    suggestions: [
      { nodeId: 'n1', label: 'Mix', confidence: 0.92 },
      { nodeId: 'n2', label: 'Fill', confidence: 0.31 },
    ],
  },
  {
    investigationId: 'i2',
    investigationName: 'Mill Hardness',
    measurementColumn: 'hardness',
    suggestions: [{ nodeId: 'n3', label: 'Cast', confidence: 0.81 }],
  },
];

describe('ProductionLineGlanceMigrationModal', () => {
  it('does not render when isOpen=false', () => {
    const { container } = render(
      <ProductionLineGlanceMigrationModal
        isOpen={false}
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders one row per entry', () => {
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Coffee Moisture')).toBeInTheDocument();
    expect(screen.getByText('Mill Hardness')).toBeInTheDocument();
  });

  it('shows suggestions for each entry, with the highest-confidence one preselected', () => {
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    const mixOption = screen.getByRole('radio', { name: /Mix/i }) as HTMLInputElement;
    expect(mixOption.checked).toBe(true);
  });

  it('fires onSave with selected node mapping on Save', () => {
    const onSave = vi.fn();
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={onSave}
        onDecline={vi.fn()}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith([
      { investigationId: 'i1', nodeId: 'n1', measurementColumn: 'moisture' },
      { investigationId: 'i2', nodeId: 'n3', measurementColumn: 'hardness' },
    ]);
  });

  it('fires onDecline with investigationId when a per-row "Skip" is clicked', () => {
    const onDecline = vi.fn();
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={onDecline}
        onClose={vi.fn()}
      />
    );
    const skipButtons = screen.getAllByRole('button', { name: /skip/i });
    fireEvent.click(skipButtons[0]);
    expect(onDecline).toHaveBeenCalledWith('i1');
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ProductionLineGlanceMigrationModal
        isOpen
        entries={entries}
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
