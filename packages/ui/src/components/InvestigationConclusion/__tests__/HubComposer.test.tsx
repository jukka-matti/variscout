import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HubComposer } from '../HubComposer';
import type { Question, Finding, SuspectedCause } from '@variscout/core/findings';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    text: 'Does Shift affect the result?',
    factor: 'Shift',
    status: 'answered',
    linkedFindingIds: [],
    createdAt: 1714000000000,
    updatedAt: 1714000000000,
    deletedAt: null,
    investigationId: 'general-unassigned',
    ...overrides,
  };
}

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: 'f1',
    text: 'Night shift shows higher spread',
    createdAt: 1714000000000,
    deletedAt: null,
    investigationId: 'general-unassigned',
    context: { activeFilters: {}, cumulativeScope: null },
    status: 'observed',
    comments: [],
    statusChangedAt: Date.now(),
    ...overrides,
  };
}

const defaultProps = () => ({
  questions: [
    makeQuestion(),
    makeQuestion({ id: 'q2', text: 'Does Head matter?', status: 'investigating' }),
  ],
  findings: [makeFinding(), makeFinding({ id: 'f2', text: 'Head 5-8 runs hotter' })],
  onSave: vi.fn(),
  onCancel: vi.fn(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HubComposer', () => {
  it('renders name input and synthesis textarea', () => {
    render(<HubComposer {...defaultProps()} />);

    expect(screen.getByPlaceholderText('Name the mechanism...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/How does the evidence connect/)).toBeInTheDocument();
  });

  it('name input has autoFocus', () => {
    render(<HubComposer {...defaultProps()} />);

    const input = screen.getByPlaceholderText('Name the mechanism...');
    // React's autoFocus prop triggers focus; in JSDOM it sets the attribute on the DOM node
    expect(input).toHaveFocus();
  });

  it('shows pre-connected questions when prefilledQuestionIds provided', () => {
    render(<HubComposer {...defaultProps()} prefilledQuestionIds={['q1']} />);

    expect(screen.getByText('Does Shift affect the result?')).toBeInTheDocument();
  });

  it('"Create Hub" button disabled when name is empty', () => {
    render(<HubComposer {...defaultProps()} />);

    const button = screen.getByTestId('hub-composer-save');
    expect(button).toBeDisabled();
  });

  it('"Create Hub" button calls onSave with name, synthesis, questionIds, findingIds, and nextMove', () => {
    const props = defaultProps();
    render(<HubComposer {...props} prefilledQuestionIds={['q1']} prefilledFindingIds={['f1']} />);

    fireEvent.change(screen.getByPlaceholderText('Name the mechanism...'), {
      target: { value: 'Nozzle wear' },
    });
    fireEvent.change(screen.getByPlaceholderText(/How does the evidence connect/), {
      target: { value: 'Thermal stress' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Next move for this branch/), {
      target: { value: 'Run a late-shift temperature check.' },
    });
    fireEvent.click(screen.getByTestId('hub-composer-save'));

    expect(props.onSave).toHaveBeenCalledWith('Nozzle wear', 'Thermal stress', ['q1'], ['f1'], {
      nextMove: 'Run a late-shift temperature check.',
    });
  });

  it('"Cancel" button calls onCancel', () => {
    const props = defaultProps();
    render(<HubComposer {...props} />);

    fireEvent.click(screen.getByTestId('hub-composer-cancel'));
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('"Connect more" section toggles open and closed', () => {
    render(<HubComposer {...defaultProps()} />);

    const toggle = screen.getByText(/Connect more/);
    expect(screen.queryByText('Does Shift affect the result?')).not.toBeInTheDocument();

    fireEvent.click(toggle);
    // After expanding, the unconnected questions should be visible as checkboxes
    expect(screen.getByText('Does Shift affect the result?')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('Does Shift affect the result?')).not.toBeInTheDocument();
  });

  it('pre-populates name and synthesis when editingHub provided', () => {
    const editingHub: SuspectedCause = {
      id: 'hub-1',
      name: 'Existing cause',
      synthesis: 'Evidence connects via thermal stress',
      questionIds: ['q1'],
      findingIds: [],
      status: 'suspected',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      investigationId: 'general-unassigned',
    };

    render(<HubComposer {...defaultProps()} editingHub={editingHub} />);

    expect(screen.getByDisplayValue('Existing cause')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Evidence connects via thermal stress')).toBeInTheDocument();
    // Save button should say "Save" instead of "Create Hub"
    expect(screen.getByTestId('hub-composer-save')).toHaveTextContent('Save');
  });

  it('pre-populates branch nextMove when editingHub provided', () => {
    const editingHub: SuspectedCause = {
      id: 'hub-1',
      name: 'Existing cause',
      synthesis: '',
      questionIds: [],
      findingIds: [],
      status: 'suspected',
      nextMove: 'Check nozzle temperature after the night run.',
      createdAt: 1714000000000,
      updatedAt: 1714000000000,
      deletedAt: null,
      investigationId: 'general-unassigned',
    };

    render(<HubComposer {...defaultProps()} editingHub={editingHub} />);

    expect(
      screen.getByDisplayValue('Check nozzle temperature after the night run.')
    ).toBeInTheDocument();
  });
});
