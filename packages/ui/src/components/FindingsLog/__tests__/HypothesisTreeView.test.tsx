import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HypothesisTreeView from '../HypothesisTreeView';
import HypothesisNode from '../HypothesisNode';
import { createHypothesis, createInvestigationCategory } from '@variscout/core';

const makeHypothesis = (text: string, parentId?: string, factor?: string) => {
  return createHypothesis(text, factor, undefined, parentId);
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

  describe('category grouping', () => {
    const equipmentCat = createInvestigationCategory('Equipment', ['Machine'], 0);
    const temporalCat = createInvestigationCategory('Temporal', ['Shift'], 1);
    const emptyCat = createInvestigationCategory('Material', [], 2);

    it('renders category headers when categories provided', () => {
      const h = makeHypothesis('Machine worn out', undefined, 'Machine');
      render(
        <HypothesisTreeView
          hypotheses={[h]}
          findings={[]}
          categories={[equipmentCat, temporalCat]}
        />
      );
      expect(screen.getByText('Equipment')).toBeTruthy();
      expect(screen.getByText('Temporal')).toBeTruthy();
    });

    it('groups hypotheses under their category', () => {
      const h1 = makeHypothesis('Machine worn out', undefined, 'Machine');
      const h2 = makeHypothesis('Night shift drift', undefined, 'Shift');
      render(
        <HypothesisTreeView
          hypotheses={[h1, h2]}
          findings={[]}
          categories={[equipmentCat, temporalCat]}
        />
      );
      // Categories start expanded — factor headers should be visible
      expect(screen.getByTestId(`factor-header-Machine`)).toBeTruthy();
      expect(screen.getByTestId(`factor-header-Shift`)).toBeTruthy();
    });

    it('renders empty category as exploration prompt', () => {
      render(<HypothesisTreeView hypotheses={[]} findings={[]} categories={[emptyCat]} />);
      expect(screen.getByText('no factors assigned')).toBeTruthy();
    });

    it('shows uncategorized hypotheses under "Other"', () => {
      const h = makeHypothesis('Unknown cause', undefined, 'UnknownFactor');
      render(<HypothesisTreeView hypotheses={[h]} findings={[]} categories={[equipmentCat]} />);
      expect(screen.getByTestId('category-group-other')).toBeTruthy();
      expect(screen.getByText('Other')).toBeTruthy();
    });

    it('does not show aggregated eta squared on category headers (avoids misleading sums)', () => {
      const h = makeHypothesis('Machine issue', undefined, 'Machine');
      render(
        <HypothesisTreeView
          hypotheses={[h]}
          findings={[]}
          categories={[equipmentCat]}
          factorVariations={{ Machine: 42.5 }}
        />
      );
      // Factor sub-header shows eta, but category header does NOT
      const catHeader = screen.getByTestId(`category-header-${equipmentCat.id}`);
      expect(catHeader.textContent).not.toContain('42.5%');
    });

    it('shows factor-level eta squared', () => {
      const h = makeHypothesis('Machine issue', undefined, 'Machine');
      render(
        <HypothesisTreeView
          hypotheses={[h]}
          findings={[]}
          categories={[equipmentCat]}
          factorVariations={{ Machine: 15.3 }}
        />
      );
      // Factor header shows eta
      expect(screen.getAllByText('15.3%').length).toBeGreaterThanOrEqual(1);
    });

    it('falls back to flat rendering when categories not provided', () => {
      const h = makeHypothesis('Test');
      render(<HypothesisTreeView hypotheses={[h]} findings={[]} />);
      expect(screen.getByText('Test')).toBeTruthy();
      expect(screen.queryByTestId(/category-group/)).toBeNull();
    });

    it('expands factor to show hypothesis nodes', () => {
      const h = makeHypothesis('Machine worn out', undefined, 'Machine');
      render(<HypothesisTreeView hypotheses={[h]} findings={[]} categories={[equipmentCat]} />);
      // Category is expanded by default, but factor is collapsed
      expect(screen.queryByText('Machine worn out')).toBeNull();
      // Click factor header to expand
      fireEvent.click(screen.getByTestId('factor-header-Machine'));
      expect(screen.getByText('Machine worn out')).toBeTruthy();
    });
  });

  describe('ValidationTaskSection (gemba/expert)', () => {
    it('renders task input for gemba type without validationTask', () => {
      const h = createHypothesis('Check nozzle', 'Machine', undefined, undefined, 'gemba');
      render(
        <HypothesisNode
          hypothesis={h}
          depth={0}
          children={[]}
          linkedFindings={[]}
          isExpanded={true}
          onToggle={() => {}}
          canAddChild={false}
          showContradicted={false}
        />
      );
      expect(screen.getByTestId(`validation-task-input-${h.id}`)).toBeTruthy();
      expect(screen.getByPlaceholderText('What needs to be checked?')).toBeTruthy();
    });

    it('calls onSetValidationTask on Enter', () => {
      const onSet = vi.fn();
      const h = createHypothesis('Check nozzle', 'Machine', undefined, undefined, 'gemba');
      render(
        <HypothesisNode
          hypothesis={h}
          depth={0}
          children={[]}
          linkedFindings={[]}
          isExpanded={true}
          onToggle={() => {}}
          canAddChild={false}
          showContradicted={false}
          onSetValidationTask={onSet}
        />
      );
      const input = screen.getByTestId(`validation-task-input-${h.id}`);
      fireEvent.change(input, { target: { value: 'Go inspect Machine 5' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onSet).toHaveBeenCalledWith(h.id, 'Go inspect Machine 5');
    });

    it('shows complete checkbox when task exists', () => {
      const h = createHypothesis('Check nozzle', 'Machine', undefined, undefined, 'gemba');
      h.validationTask = 'Go check Machine 5';
      render(
        <HypothesisNode
          hypothesis={h}
          depth={0}
          children={[]}
          linkedFindings={[]}
          isExpanded={true}
          onToggle={() => {}}
          canAddChild={false}
          showContradicted={false}
        />
      );
      expect(screen.getByText('Go check Machine 5')).toBeTruthy();
      expect(screen.getByTestId(`validation-task-complete-${h.id}`)).toBeTruthy();
    });

    it('calls onCompleteTask when checkbox clicked', () => {
      const onComplete = vi.fn();
      const h = createHypothesis('Check nozzle', 'Machine', undefined, undefined, 'gemba');
      h.validationTask = 'Go check Machine 5';
      render(
        <HypothesisNode
          hypothesis={h}
          depth={0}
          children={[]}
          linkedFindings={[]}
          isExpanded={true}
          onToggle={() => {}}
          canAddChild={false}
          showContradicted={false}
          onCompleteTask={onComplete}
        />
      );
      fireEvent.click(screen.getByTestId(`validation-task-complete-${h.id}`));
      expect(onComplete).toHaveBeenCalledWith(h.id);
    });

    it('shows status buttons after task completed', () => {
      const h = createHypothesis('Check nozzle', 'Machine', undefined, undefined, 'gemba');
      h.validationTask = 'Go check Machine 5';
      h.taskCompleted = true;
      render(
        <HypothesisNode
          hypothesis={h}
          depth={0}
          children={[]}
          linkedFindings={[]}
          isExpanded={true}
          onToggle={() => {}}
          canAddChild={false}
          showContradicted={false}
        />
      );
      expect(screen.getByTestId(`validation-status-supported-${h.id}`)).toBeTruthy();
      expect(screen.getByTestId(`validation-status-contradicted-${h.id}`)).toBeTruthy();
      expect(screen.getByTestId(`validation-status-partial-${h.id}`)).toBeTruthy();
    });

    it('does NOT render for data-validated hypotheses', () => {
      const h = createHypothesis('Data check', 'Machine');
      // validationType is undefined (defaults to data)
      render(
        <HypothesisNode
          hypothesis={h}
          depth={0}
          children={[]}
          linkedFindings={[]}
          isExpanded={true}
          onToggle={() => {}}
          canAddChild={false}
          showContradicted={false}
        />
      );
      expect(screen.queryByTestId(`validation-task-section-${h.id}`)).toBeNull();
    });
  });
});
