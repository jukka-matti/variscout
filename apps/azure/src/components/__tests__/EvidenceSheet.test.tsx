import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Finding, ProcessStateItem } from '@variscout/core';
import EvidenceSheet from '../EvidenceSheet';

const buildItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Capability gap',
  ...overrides,
});

const buildFinding = (id: string, status: Finding['status'], text = 'A finding'): Finding =>
  ({
    id,
    text,
    createdAt: 1714000000000,
    context: {} as Finding['context'],
    status,
    comments: [],
    statusChangedAt: 1714000000000,
  }) as Finding;

describe('EvidenceSheet', () => {
  it('renders nothing when item is null', () => {
    render(<EvidenceSheet item={null} findings={[]} onSelectFinding={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByTestId('evidence-sheet')).not.toBeInTheDocument();
  });

  it('shows a loading state when findings is null', () => {
    render(
      <EvidenceSheet
        item={buildItem()}
        findings={null}
        onSelectFinding={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty-state placeholder when findings is empty', () => {
    render(
      <EvidenceSheet item={buildItem()} findings={[]} onSelectFinding={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText(/no findings recorded/i)).toBeInTheDocument();
  });

  it('renders finding labels + statuses', () => {
    const findings = [
      buildFinding('f-1', 'analyzed', 'First'),
      buildFinding('f-2', 'resolved', 'Second'),
    ];
    render(
      <EvidenceSheet
        item={buildItem()}
        findings={findings}
        onSelectFinding={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText(/analyzed/i)).toBeInTheDocument();
    expect(screen.getByText(/resolved/i)).toBeInTheDocument();
  });

  it('fires onSelectFinding when a finding row is clicked', () => {
    const finding = buildFinding('f-1', 'analyzed', 'Click me');
    const onSelectFinding = vi.fn();
    render(
      <EvidenceSheet
        item={buildItem()}
        findings={[finding]}
        onSelectFinding={onSelectFinding}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Click me'));
    expect(onSelectFinding).toHaveBeenCalledWith(finding);
  });

  it('fires onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <EvidenceSheet item={buildItem()} findings={[]} onSelectFinding={vi.fn()} onClose={onClose} />
    );
    fireEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
