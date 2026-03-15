import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HypothesisTreeView from '../HypothesisTreeView';
import { createHypothesis } from '@variscout/core';

const makeHypothesis = (text: string, parentId?: string) => {
  return createHypothesis(text, undefined, undefined, parentId);
};

describe('HypothesisTreeView', () => {
  it('renders empty state when no hypotheses', () => {
    render(<HypothesisTreeView hypotheses={[]} findings={[]} />);
    expect(screen.getByText('No hypotheses yet')).toBeTruthy();
  });

  it('renders root hypotheses', () => {
    const h1 = makeHypothesis('Machine issue');
    const h2 = makeHypothesis('Shift issue');
    render(<HypothesisTreeView hypotheses={[h1, h2]} findings={[]} />);
    expect(screen.getByText('Machine issue')).toBeTruthy();
    expect(screen.getByText('Shift issue')).toBeTruthy();
  });

  it('renders tree structure with children', () => {
    const root = makeHypothesis('Root cause');
    const child = makeHypothesis('Sub cause', root.id);
    render(<HypothesisTreeView hypotheses={[root, child]} findings={[]} />);
    expect(screen.getByText('Root cause')).toBeTruthy();
    // Child is not visible until expanded
    expect(screen.queryByText('Sub cause')).toBeNull();
  });

  it('expands/collapses nodes on toggle click', () => {
    const root = makeHypothesis('Root cause');
    const child = makeHypothesis('Sub cause', root.id);
    render(<HypothesisTreeView hypotheses={[root, child]} findings={[]} />);

    // Click expand button (▶)
    const expandBtn = screen.getByLabelText('Expand');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Sub cause')).toBeTruthy();

    // Click collapse button (▼)
    const collapseBtn = screen.getByLabelText('Collapse');
    fireEvent.click(collapseBtn);
    expect(screen.queryByText('Sub cause')).toBeNull();
  });

  it('calls onSelectHypothesis when clicking a node', () => {
    const onSelect = vi.fn();
    const h = makeHypothesis('Test');
    render(<HypothesisTreeView hypotheses={[h]} findings={[]} onSelectHypothesis={onSelect} />);
    fireEvent.click(screen.getByText('Test'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'Test' }));
  });

  it('shows linked findings count', () => {
    const h = makeHypothesis('Test');
    h.linkedFindingIds = ['f-1', 'f-2'];
    render(<HypothesisTreeView hypotheses={[h]} findings={[]} />);
    expect(screen.getByText('2 findings')).toBeTruthy();
  });

  it('shows add sub-hypothesis button on hover', () => {
    const onAdd = vi.fn();
    const h = makeHypothesis('Root');
    render(<HypothesisTreeView hypotheses={[h]} findings={[]} onAddSubHypothesis={onAdd} />);
    const addBtn = screen.getByTitle('Add sub-hypothesis');
    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalledWith(h.id);
  });

  it('applies strikethrough to contradicted hypotheses', () => {
    const h = makeHypothesis('Bad idea');
    h.status = 'contradicted';
    render(<HypothesisTreeView hypotheses={[h]} findings={[]} showContradicted />);
    const text = screen.getByText('Bad idea');
    expect(text.className).toContain('line-through');
  });

  it('hides contradicted hypotheses by default', () => {
    const root = makeHypothesis('Root');
    const okChild = makeHypothesis('Good child', root.id);
    const badChild = makeHypothesis('Contradicted child', root.id);
    badChild.status = 'contradicted';
    render(<HypothesisTreeView hypotheses={[root, okChild, badChild]} findings={[]} />);
    // Expand root (visible because okChild exists)
    const expandBtn = screen.getByLabelText('Expand');
    fireEvent.click(expandBtn);
    // Good child visible, contradicted hidden
    expect(screen.getByText('Good child')).toBeTruthy();
    expect(screen.queryByText('Contradicted child')).toBeNull();
  });

  it('shows contradicted hypotheses when showContradicted is true', () => {
    const root = makeHypothesis('Root');
    const child = makeHypothesis('Contradicted child', root.id);
    child.status = 'contradicted';
    render(<HypothesisTreeView hypotheses={[root, child]} findings={[]} showContradicted />);
    // Expand root
    const expandBtn = screen.getByLabelText('Expand');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Contradicted child')).toBeTruthy();
  });

  it('has tree role for accessibility', () => {
    const h = makeHypothesis('Test');
    render(<HypothesisTreeView hypotheses={[h]} findings={[]} />);
    expect(screen.getByRole('tree')).toBeTruthy();
  });
});
