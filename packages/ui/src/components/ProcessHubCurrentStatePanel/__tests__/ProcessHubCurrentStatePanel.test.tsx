import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import type {
  CurrentProcessState,
  Finding,
  ProcessStateItem,
  ProcessStateLens,
  ProcessStateNote,
} from '@variscout/core';
import type { ResponsePathAction } from '@variscout/core';
import { ProcessHubCurrentStatePanel } from '../ProcessHubCurrentStatePanel';

const HUB = {
  id: 'h-1',
  name: 'Filling Line A',
  description: undefined,
  processOwner: undefined,
};

const ZERO_LENS_COUNTS: Record<ProcessStateLens, number> = {
  outcome: 0,
  flow: 0,
  conversion: 0,
  measurement: 0,
  sustainment: 0,
};

const buildState = (overrides: Partial<CurrentProcessState> = {}): CurrentProcessState => ({
  hub: HUB,
  assessedAt: '2026-04-27T00:00:00.000Z',
  overallSeverity: 'neutral',
  items: [],
  lensCounts: { ...ZERO_LENS_COUNTS },
  responsePathCounts: {},
  ...overrides,
});

const buildItem = (overrides: Partial<ProcessStateItem> = {}): ProcessStateItem => ({
  id: 'item-1',
  lens: 'outcome',
  severity: 'amber',
  responsePath: 'monitor',
  source: 'review-signal',
  label: 'Capability gap',
  ...overrides,
});

const NOOP_ACTION: ResponsePathAction = { kind: 'unsupported', reason: 'informational' };

function makeActions(
  overrides: { actionFor?: (item: ProcessStateItem) => ResponsePathAction } = {}
) {
  const actionFor = overrides.actionFor ?? (() => NOOP_ACTION);
  const onInvoke = vi.fn();
  return { actionFor, onInvoke };
}

function makeEvidence() {
  // Stubbed evidence contract for PR #4 tests; chip behavior is tested in PR #5.
  return {
    findingsFor: () => [],
    onChipClick: vi.fn(),
  };
}

function makeNotes(
  overrides: { notesFor?: (item: ProcessStateItem) => readonly ProcessStateNote[] } = {}
) {
  return {
    notesFor: overrides.notesFor ?? (() => []),
    onRequestAddNote: vi.fn(),
    onRequestEditNote: vi.fn(),
    onDeleteNote: vi.fn(),
    currentUserId: 'tester',
  };
}

const sampleNote = (overrides: Partial<ProcessStateNote> = {}): ProcessStateNote => ({
  id: 'note-1',
  itemId: 'item-1',
  kind: 'question',
  text: 'Are we sure?',
  author: 'tester',
  createdAt: '2026-04-27T14:00:00.000Z',
  ...overrides,
});

describe('ProcessHubCurrentStatePanel', () => {
  it('renders the heading and overall severity badge', () => {
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ overallSeverity: 'red' })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByTestId('current-process-state')).toBeInTheDocument();
    expect(screen.getByText('Current Process State')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeInTheDocument();
  });

  it('renders all five lens count cards using lensCounts', () => {
    const state = buildState({
      lensCounts: { outcome: 3, flow: 1, conversion: 0, measurement: 2, sustainment: 5 },
    });
    render(
      <ProcessHubCurrentStatePanel
        state={state}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByTestId('current-state-lens-outcome')).toHaveTextContent('3');
    expect(screen.getByTestId('current-state-lens-flow')).toHaveTextContent('1');
    expect(screen.getByTestId('current-state-lens-conversion')).toHaveTextContent('0');
    expect(screen.getByTestId('current-state-lens-measurement')).toHaveTextContent('2');
    expect(screen.getByTestId('current-state-lens-sustainment')).toHaveTextContent('5');
  });

  it('shows the empty placeholder when there are no items', () => {
    render(
      <ProcessHubCurrentStatePanel
        state={buildState()}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByText('No current process state signals yet')).toBeInTheDocument();
  });

  it('renders item cards capped at 6 with a +N indicator for the rest', () => {
    const items = Array.from({ length: 9 }, (_, i) =>
      buildItem({ id: `item-${i}`, label: `Item ${i + 1}` })
    );
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getAllByTestId('current-state-item')).toHaveLength(6);
    expect(screen.getByText('+3 more current-state items')).toBeInTheDocument();
  });

  it('formats Cpk vs target detail when both are present on metric', () => {
    const item = buildItem({
      lens: 'outcome',
      metric: { cpk: 1.05, cpkTarget: 1.33 },
    });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    const card = screen.getByTestId('current-state-item');
    expect(within(card).getByText(/Cpk 1\.05 vs target 1\.33/)).toBeInTheDocument();
  });

  it('formats change-signal count using singular vs plural', () => {
    const items = [
      buildItem({ id: 'a', lens: 'flow', metric: { changeSignalCount: 1 } }),
      buildItem({ id: 'b', lens: 'flow', metric: { changeSignalCount: 4 } }),
    ];
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items, overallSeverity: 'amber' })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByText('1 change signal')).toBeInTheDocument();
    expect(screen.getByText('4 change signals')).toBeInTheDocument();
  });

  it('falls back to item.detail when no metric formatter applies', () => {
    const item = buildItem({ detail: 'Free-text fallback' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByText('Free-text fallback')).toBeInTheDocument();
  });

  it('renders the response path label per item', () => {
    const item = buildItem({ responsePath: 'chartered-project' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByText('Chartered project')).toBeInTheDocument();
  });
});

describe('ProcessHubCurrentStatePanel — actions', () => {
  it('fires onInvoke with the supported action when card is clicked', async () => {
    const supportedAction: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-1',
      intent: 'focused',
    };
    const item = buildItem({ id: 'item-x', responsePath: 'focused-investigation' });
    const actions = makeActions({ actionFor: () => supportedAction });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.click();

    expect(actions.onInvoke).toHaveBeenCalledWith(item, supportedAction);
  });

  it('does NOT fire onInvoke for unsupported/planned cards', async () => {
    const item = buildItem({ id: 'item-msa', responsePath: 'measurement-system-work' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'planned' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.click();

    expect(actions.onInvoke).not.toHaveBeenCalled();
  });

  it('renders Planned pill on cards with unsupported/planned action', () => {
    const item = buildItem({ id: 'item-msa', responsePath: 'measurement-system-work' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'planned' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    expect(within(card).getByText(/Planned/)).toBeInTheDocument();
  });

  it('renders Informational pill on cards with unsupported/informational action', () => {
    const item = buildItem({ id: 'item-mon', responsePath: 'monitor' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'informational' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    expect(within(card).getByText(/Informational/)).toBeInTheDocument();
  });

  it('exposes a tooltip-text attribute on Planned cards', () => {
    const item = buildItem({ id: 'item-msa', responsePath: 'measurement-system-work' });
    const actions = makeActions({
      actionFor: () => ({ kind: 'unsupported', reason: 'planned' }),
    });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    expect(card).toHaveAttribute('title', expect.stringMatching(/planned/i));
  });

  it('makes the supported card keyboard-activatable (Enter key)', () => {
    const action: ResponsePathAction = {
      kind: 'open-sustainment',
      investigationId: 'inv-y',
      surface: 'review',
    };
    const item = buildItem({ id: 'item-y', responsePath: 'sustainment-review' });
    const actions = makeActions({ actionFor: () => action });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(actions.onInvoke).toHaveBeenCalledWith(item, action);
  });

  it('makes the supported card keyboard-activatable (Space key) per ARIA button conventions', () => {
    const action: ResponsePathAction = {
      kind: 'open-investigation',
      investigationId: 'inv-z',
      intent: 'quick',
    };
    const item = buildItem({ id: 'item-z', responsePath: 'quick-action' });
    const actions = makeActions({ actionFor: () => action });

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={actions}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );

    const card = screen.getByTestId('current-state-item');
    card.focus();
    card.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(actions.onInvoke).toHaveBeenCalledWith(item, action);
  });
});

describe('ProcessHubCurrentStatePanel — evidence chip', () => {
  it('shows the chip with finding count when findingsFor returns non-empty', () => {
    const item = buildItem({ id: 'item-e1', responsePath: 'focused-investigation' });
    const findings = [
      { id: 'f-1' } as unknown as Finding,
      { id: 'f-2' } as unknown as Finding,
      { id: 'f-3' } as unknown as Finding,
    ];
    const evidence = {
      findingsFor: () => findings,
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={evidence}
        notes={makeNotes()}
      />
    );

    const chip = screen.getByTestId('current-state-evidence-chip');
    expect(chip).toHaveTextContent('3 findings');
  });

  it('shows singular text for one finding', () => {
    const item = buildItem({ id: 'item-e2' });
    const evidence = {
      findingsFor: () => [{ id: 'f-only' } as unknown as Finding],
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={evidence}
        notes={makeNotes()}
      />
    );

    expect(screen.getByTestId('current-state-evidence-chip')).toHaveTextContent('1 finding');
  });

  it('omits the chip when findingsFor returns empty', () => {
    const item = buildItem({ id: 'item-e3' });
    const evidence = {
      findingsFor: () => [],
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={evidence}
        notes={makeNotes()}
      />
    );

    expect(screen.queryByTestId('current-state-evidence-chip')).not.toBeInTheDocument();
  });

  it('fires onChipClick with item + findings on chip click and stops card propagation', () => {
    const item = buildItem({ id: 'item-e4', responsePath: 'focused-investigation' });
    const findings = [{ id: 'f-1' } as unknown as Finding];
    const onChipClick = vi.fn();
    const onInvoke = vi.fn();

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={{
          actionFor: () => ({
            kind: 'open-investigation' as const,
            investigationId: 'inv-x',
            intent: 'focused' as const,
          }),
          onInvoke,
        }}
        evidence={{ findingsFor: () => findings, onChipClick }}
        notes={makeNotes()}
      />
    );

    const chip = screen.getByTestId('current-state-evidence-chip');
    chip.click();

    expect(onChipClick).toHaveBeenCalledWith(item, findings);
    // Card click should NOT have fired because chip stops propagation
    expect(onInvoke).not.toHaveBeenCalled();
  });

  it('renders chip on Planned/unsupported cards too (chip independent of action support)', () => {
    const item = buildItem({ id: 'item-e5', responsePath: 'measurement-system-work' });
    const findings = [{ id: 'f-1' } as unknown as Finding];
    const evidence = {
      findingsFor: () => findings,
      onChipClick: vi.fn(),
    };

    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions({
          actionFor: () => ({ kind: 'unsupported' as const, reason: 'planned' as const }),
        })}
        evidence={evidence}
        notes={makeNotes()}
      />
    );

    expect(screen.getByTestId('current-state-evidence-chip')).toHaveTextContent('1 finding');
  });
});

describe('ProcessHubCurrentStatePanel — notes', () => {
  it('renders a [+ note] affordance on each state-item card', () => {
    const item = buildItem({ id: 'item-1' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes()}
      />
    );
    expect(screen.getByTestId('current-state-add-note')).toBeInTheDocument();
  });

  it('does NOT show edit/delete affordances on notes by other authors', () => {
    const item = buildItem({ id: 'item-1' });
    const note = sampleNote({ author: 'someone-else' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => [note] })}
      />
    );
    expect(screen.queryByTestId(`current-state-note-edit-${note.id}`)).not.toBeInTheDocument();
    expect(screen.queryByTestId(`current-state-note-delete-${note.id}`)).not.toBeInTheDocument();
  });

  it('shows edit + delete affordances on own notes', () => {
    const item = buildItem({ id: 'item-1' });
    const note = sampleNote({ author: 'tester' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => [note] })}
      />
    );
    expect(screen.getByTestId(`current-state-note-edit-${note.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`current-state-note-delete-${note.id}`)).toBeInTheDocument();
  });

  it('renders all notes for the item with kind label and text', () => {
    const item = buildItem({ id: 'item-1' });
    const notes = [
      sampleNote({ id: 'n-1', kind: 'question', text: 'First note' }),
      sampleNote({ id: 'n-2', kind: 'gemba', text: 'Second note' }),
    ];
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => notes })}
      />
    );
    expect(screen.getByText('First note')).toBeInTheDocument();
    expect(screen.getByText('Second note')).toBeInTheDocument();
  });

  it('omits the notes list when notesFor returns empty', () => {
    const item = buildItem({ id: 'item-1' });
    render(
      <ProcessHubCurrentStatePanel
        state={buildState({ items: [item] })}
        actions={makeActions()}
        evidence={makeEvidence()}
        notes={makeNotes({ notesFor: () => [] })}
      />
    );
    expect(screen.queryByTestId('current-state-notes-list')).not.toBeInTheDocument();
  });
});
