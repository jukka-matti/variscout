import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionTreeView from '../QuestionTreeView';
import QuestionNode from '../QuestionNode';
import { createQuestion, createInvestigationCategory } from '@variscout/core';

const makeQuestion = (text: string, parentId?: string, factor?: string) => {
  return createQuestion(text, 'general-unassigned', factor, undefined, parentId);
};

describe('QuestionTreeView', () => {
  it('renders empty state when no questions', () => {
    render(<QuestionTreeView questions={[]} findings={[]} />);
    expect(screen.getByText('No questions yet')).toBeTruthy();
  });

  it('renders root questions', () => {
    const h1 = makeQuestion('Machine issue');
    const h2 = makeQuestion('Shift issue');
    render(<QuestionTreeView questions={[h1, h2]} findings={[]} />);
    expect(screen.getByText('Machine issue')).toBeTruthy();
    expect(screen.getByText('Shift issue')).toBeTruthy();
  });

  it('renders tree structure with children', () => {
    const root = makeQuestion('Root cause');
    const child = makeQuestion('Sub cause', root.id);
    render(<QuestionTreeView questions={[root, child]} findings={[]} />);
    expect(screen.getByText('Root cause')).toBeTruthy();
    // Child is not visible until expanded
    expect(screen.queryByText('Sub cause')).toBeNull();
  });

  it('expands/collapses nodes on toggle click', () => {
    const root = makeQuestion('Root cause');
    const child = makeQuestion('Sub cause', root.id);
    render(<QuestionTreeView questions={[root, child]} findings={[]} />);

    // Click expand button (▶)
    const expandBtn = screen.getByLabelText('Expand');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Sub cause')).toBeTruthy();

    // Click collapse button (▼)
    const collapseBtn = screen.getByLabelText('Collapse');
    fireEvent.click(collapseBtn);
    expect(screen.queryByText('Sub cause')).toBeNull();
  });

  it('calls onSelectQuestion when clicking a node', () => {
    const onSelect = vi.fn();
    const h = makeQuestion('Test');
    render(<QuestionTreeView questions={[h]} findings={[]} onSelectQuestion={onSelect} />);
    fireEvent.click(screen.getByText('Test'));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'Test' }));
  });

  it('shows linked findings count', () => {
    const h = makeQuestion('Test');
    h.linkedFindingIds = ['f-1', 'f-2'];
    render(<QuestionTreeView questions={[h]} findings={[]} />);
    expect(screen.getByText('2 findings')).toBeTruthy();
  });

  it('shows inline sub-question form on "+" click and calls onAddSubQuestion on submit', () => {
    const onAdd = vi.fn();
    const h = makeQuestion('Root');
    render(<QuestionTreeView questions={[h]} findings={[]} onAddSubQuestion={onAdd} />);
    const addBtn = screen.getByTitle('Add sub-question');
    fireEvent.click(addBtn);
    // Inline form should appear
    const input = screen.getByPlaceholderText('What might cause this?');
    fireEvent.change(input, { target: { value: 'Sub cause' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onAdd).toHaveBeenCalledWith(h.id, 'Sub cause', undefined, 'data');
  });

  it('applies strikethrough to contradicted questions', () => {
    const h = makeQuestion('Bad idea');
    h.status = 'ruled-out';
    render(<QuestionTreeView questions={[h]} findings={[]} showContradicted />);
    const text = screen.getByText('Bad idea');
    expect(text.className).toContain('line-through');
  });

  it('hides contradicted questions by default', () => {
    const root = makeQuestion('Root');
    const okChild = makeQuestion('Good child', root.id);
    const badChild = makeQuestion('Contradicted child', root.id);
    badChild.status = 'ruled-out';
    render(<QuestionTreeView questions={[root, okChild, badChild]} findings={[]} />);
    // Expand root (visible because okChild exists)
    const expandBtn = screen.getByLabelText('Expand');
    fireEvent.click(expandBtn);
    // Good child visible, contradicted hidden
    expect(screen.getByText('Good child')).toBeTruthy();
    expect(screen.queryByText('Contradicted child')).toBeNull();
  });

  it('shows contradicted questions when showContradicted is true', () => {
    const root = makeQuestion('Root');
    const child = makeQuestion('Contradicted child', root.id);
    child.status = 'ruled-out';
    render(<QuestionTreeView questions={[root, child]} findings={[]} showContradicted />);
    // Expand root
    const expandBtn = screen.getByLabelText('Expand');
    fireEvent.click(expandBtn);
    expect(screen.getByText('Contradicted child')).toBeTruthy();
  });

  it('has tree role for accessibility', () => {
    const h = makeQuestion('Test');
    render(<QuestionTreeView questions={[h]} findings={[]} />);
    expect(screen.getByRole('tree')).toBeTruthy();
  });

  describe('category grouping', () => {
    const equipmentCat = createInvestigationCategory('Equipment', ['Machine'], 0);
    const temporalCat = createInvestigationCategory('Temporal', ['Shift'], 1);
    const emptyCat = createInvestigationCategory('Material', [], 2);

    it('renders category headers when categories provided', () => {
      const h = makeQuestion('Machine worn out', undefined, 'Machine');
      render(
        <QuestionTreeView questions={[h]} findings={[]} categories={[equipmentCat, temporalCat]} />
      );
      expect(screen.getByText('Equipment')).toBeTruthy();
      expect(screen.getByText('Temporal')).toBeTruthy();
    });

    it('groups questions under their category', () => {
      const h1 = makeQuestion('Machine worn out', undefined, 'Machine');
      const h2 = makeQuestion('Night shift drift', undefined, 'Shift');
      render(
        <QuestionTreeView
          questions={[h1, h2]}
          findings={[]}
          categories={[equipmentCat, temporalCat]}
        />
      );
      // Categories start expanded — factor headers should be visible
      expect(screen.getByTestId(`factor-header-Machine`)).toBeTruthy();
      expect(screen.getByTestId(`factor-header-Shift`)).toBeTruthy();
    });

    it('renders empty category as exploration prompt', () => {
      render(<QuestionTreeView questions={[]} findings={[]} categories={[emptyCat]} />);
      expect(screen.getByText('no factors assigned')).toBeTruthy();
    });

    it('shows uncategorized questions under "Other"', () => {
      const h = makeQuestion('Unknown cause', undefined, 'UnknownFactor');
      render(<QuestionTreeView questions={[h]} findings={[]} categories={[equipmentCat]} />);
      expect(screen.getByTestId('category-group-other')).toBeTruthy();
      expect(screen.getByText('Other')).toBeTruthy();
    });

    it('does not show aggregated eta squared on category headers (avoids misleading sums)', () => {
      const h = makeQuestion('Machine issue', undefined, 'Machine');
      render(
        <QuestionTreeView
          questions={[h]}
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
      const h = makeQuestion('Machine issue', undefined, 'Machine');
      render(
        <QuestionTreeView
          questions={[h]}
          findings={[]}
          categories={[equipmentCat]}
          factorVariations={{ Machine: 15.3 }}
        />
      );
      // Factor header shows eta
      expect(screen.getAllByText('15.3%').length).toBeGreaterThanOrEqual(1);
    });

    it('falls back to flat rendering when categories not provided', () => {
      const h = makeQuestion('Test');
      render(<QuestionTreeView questions={[h]} findings={[]} />);
      expect(screen.getByText('Test')).toBeTruthy();
      expect(screen.queryByTestId(/category-group/)).toBeNull();
    });

    it('expands factor to show question nodes', () => {
      const h = makeQuestion('Machine worn out', undefined, 'Machine');
      render(<QuestionTreeView questions={[h]} findings={[]} categories={[equipmentCat]} />);
      // Category is expanded by default, but factor is collapsed
      expect(screen.queryByText('Machine worn out')).toBeNull();
      // Click factor header to expand
      fireEvent.click(screen.getByTestId('factor-header-Machine'));
      expect(screen.getByText('Machine worn out')).toBeTruthy();
    });
  });

  describe('ValidationTaskSection (gemba/expert)', () => {
    it('renders task input for gemba type without validationTask', () => {
      const h = createQuestion(
        'Check nozzle',
        'general-unassigned',
        'Machine',
        undefined,
        undefined,
        'gemba'
      );
      render(
        <QuestionNode
          question={h}
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
      const h = createQuestion(
        'Check nozzle',
        'general-unassigned',
        'Machine',
        undefined,
        undefined,
        'gemba'
      );
      render(
        <QuestionNode
          question={h}
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
      const h = createQuestion(
        'Check nozzle',
        'general-unassigned',
        'Machine',
        undefined,
        undefined,
        'gemba'
      );
      h.validationTask = 'Go check Machine 5';
      render(
        <QuestionNode
          question={h}
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
      const h = createQuestion(
        'Check nozzle',
        'general-unassigned',
        'Machine',
        undefined,
        undefined,
        'gemba'
      );
      h.validationTask = 'Go check Machine 5';
      render(
        <QuestionNode
          question={h}
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
      const h = createQuestion(
        'Check nozzle',
        'general-unassigned',
        'Machine',
        undefined,
        undefined,
        'gemba'
      );
      h.validationTask = 'Go check Machine 5';
      h.taskCompleted = true;
      render(
        <QuestionNode
          question={h}
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

    it('does NOT render for data-validated questions', () => {
      const h = createQuestion('Data check', 'Machine');
      // validationType is undefined (defaults to data)
      render(
        <QuestionNode
          question={h}
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
