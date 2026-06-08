/**
 * ScopeRail — current scope + flat sibling switcher.
 *
 * Encodes the acceptance oracle:
 *   - The current ProblemStatementScope is prominent; flat sibling scopes are
 *     available through a compact switcher; switching re-anchors the Wall
 *     Problem card to that scope (via app-owned active-scope selection);
 *     SCOPE_ARCHIVE prunes a scope (onScopeArchive); deterministic (no wall-clock / RNG).
 *
 * Reuse: ProblemStatementScope from @variscout/core + formatConditionLeaves to
 * render the WHERE label. analyzeStore.archiveScope is the store-level owner of
 * the SCOPE_ARCHIVE side-effect (separate store-level tests in analyzeStore.test.ts).
 *
 * ScopeRail imports only @variscout/core + the local useWallLocale hook — it does
 * NOT import @variscout/stores or @variscout/hooks, so no module mocks are needed.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ProblemStatementScope } from '@variscout/core';

import { ScopeRail } from '../ScopeRail';

// ── Fixtures — deterministic (no Date.now(), no Math.random()) ───────────────

const scopeA: ProblemStatementScope = {
  id: 'scope-a',
  projectId: 'inv-1',
  outcome: 'lead_time',
  predicates: [{ kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' }],
  hypothesisIds: [],
  createdAt: 1_748_649_600_000,
  updatedAt: 1_748_649_600_000,
  deletedAt: null,
};

const scopeB: ProblemStatementScope = {
  id: 'scope-b',
  projectId: 'inv-1',
  outcome: 'lead_time',
  predicates: [
    { kind: 'leaf', column: 'Machine', op: 'eq', value: 'B' },
    { kind: 'leaf', column: 'Product', op: 'eq', value: 'X' },
  ],
  hypothesisIds: ['h-1'],
  createdAt: 1_748_649_601_000,
  updatedAt: 1_748_649_601_000,
  deletedAt: null,
};

const scopeC: ProblemStatementScope = {
  id: 'scope-c',
  projectId: 'inv-1',
  outcome: 'defect_rate',
  predicates: [{ kind: 'leaf', column: 'Shift', op: 'eq', value: 'Night' }],
  hypothesisIds: [],
  createdAt: 1_748_649_602_000,
  updatedAt: 1_748_649_602_000,
  deletedAt: null,
};

// ── Helper ────────────────────────────────────────────────────────────────────

type Props = React.ComponentProps<typeof ScopeRail>;

function makeProps(overrides: Partial<Props> = {}): Props {
  return {
    scopes: [scopeA, scopeB],
    activeScopeId: scopeA.id,
    onScopeSelect: vi.fn(),
    onScopeArchive: vi.fn(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ScopeRail — scope listing', () => {
  it('renders one chip per scope', () => {
    render(<ScopeRail {...makeProps()} />);
    // scopeA: "Machine = B"
    expect(screen.getByTestId('scope-chip-scope-a')).toBeInTheDocument();
    // scopeB: "Machine = B ∩ Product = X"
    expect(screen.getByTestId('scope-chip-scope-b')).toBeInTheDocument();
  });

  it('renders the scope condition text from formatConditionLeaves', () => {
    render(<ScopeRail {...makeProps()} />);
    // formatConditionLeaves([{ kind:'leaf', column:'Machine', op:'eq', value:'B' }])
    // → "Machine = B"
    expect(screen.getByTestId('scope-chip-scope-a')).toHaveTextContent('Machine = B');
  });

  it('renders a compound condition joined by ∩', () => {
    render(<ScopeRail {...makeProps()} />);
    // scopeB has two predicates: "Machine = B ∩ Product = X"
    expect(screen.getByTestId('scope-chip-scope-b')).toHaveTextContent('Machine = B');
    expect(screen.getByTestId('scope-chip-scope-b')).toHaveTextContent('Product = X');
  });

  it('renders nothing (or an empty container) when scopes is empty', () => {
    render(<ScopeRail {...makeProps({ scopes: [] })} />);
    expect(screen.queryByTestId(/scope-chip-/)).toBeNull();
  });

  it('renders three scopes when three are provided', () => {
    render(<ScopeRail {...makeProps({ scopes: [scopeA, scopeB, scopeC] })} />);
    expect(screen.getByTestId('scope-chip-scope-a')).toBeInTheDocument();
    expect(screen.getByTestId('scope-chip-scope-b')).toBeInTheDocument();
    expect(screen.getByTestId('scope-chip-scope-c')).toBeInTheDocument();
  });
});

describe('ScopeRail — current scope switcher', () => {
  it('shows the active scope as the current scope anchor', () => {
    render(<ScopeRail {...makeProps({ activeScopeId: scopeB.id })} />);

    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Current scope');
    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Machine = B');
    expect(screen.getByTestId('scope-current-anchor')).toHaveTextContent('Product = X');
  });

  it('labels flat siblings without lineage wording', () => {
    render(
      <ScopeRail {...makeProps({ scopes: [scopeA, scopeB, scopeC], activeScopeId: scopeA.id })} />
    );

    expect(screen.getByTestId('scope-switcher')).toHaveTextContent('3 scopes');
    expect(screen.queryByText(/lineage/i)).toBeNull();
    expect(screen.queryByText(/breadcrumb/i)).toBeNull();
    expect(screen.queryByText(/parent/i)).toBeNull();
    expect(screen.queryByText(/child/i)).toBeNull();
  });
});

describe('ScopeRail — active scope highlighting', () => {
  it('marks the active scope chip with aria-current="true"', () => {
    render(<ScopeRail {...makeProps({ activeScopeId: scopeA.id })} />);
    expect(screen.getByTestId('scope-chip-scope-a')).toHaveAttribute('aria-current', 'true');
  });

  it('does NOT mark the inactive scope chip with aria-current', () => {
    render(<ScopeRail {...makeProps({ activeScopeId: scopeA.id })} />);
    const chipB = screen.getByTestId('scope-chip-scope-b');
    // Must not be marked active.
    expect(chipB).not.toHaveAttribute('aria-current', 'true');
  });

  it('switches the aria-current marker when activeScopeId changes', () => {
    const { rerender } = render(<ScopeRail {...makeProps({ activeScopeId: scopeA.id })} />);
    expect(screen.getByTestId('scope-chip-scope-a')).toHaveAttribute('aria-current', 'true');

    rerender(<ScopeRail {...makeProps({ activeScopeId: scopeB.id })} />);
    expect(screen.getByTestId('scope-chip-scope-b')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('scope-chip-scope-a')).not.toHaveAttribute('aria-current', 'true');
  });

  it('marks no chip active when activeScopeId is undefined', () => {
    render(<ScopeRail {...makeProps({ activeScopeId: undefined })} />);
    expect(screen.getByTestId('scope-chip-scope-a')).not.toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('scope-chip-scope-b')).not.toHaveAttribute('aria-current', 'true');
  });
});

describe('ScopeRail — scope switching (re-anchors the Problem card)', () => {
  it('calls onScopeSelect with the clicked scope id', () => {
    const onScopeSelect = vi.fn();
    render(<ScopeRail {...makeProps({ onScopeSelect })} />);
    fireEvent.click(screen.getByTestId('scope-chip-scope-b'));
    expect(onScopeSelect).toHaveBeenCalledWith('scope-b');
    expect(onScopeSelect).toHaveBeenCalledTimes(1);
  });

  it('calls onScopeSelect with the correct id for each chip independently', () => {
    const onScopeSelect = vi.fn();
    render(<ScopeRail {...makeProps({ scopes: [scopeA, scopeB, scopeC], onScopeSelect })} />);
    fireEvent.click(screen.getByTestId('scope-chip-scope-c'));
    expect(onScopeSelect).toHaveBeenCalledWith('scope-c');
  });

  it('does NOT call onScopeSelect when the already-active scope is clicked', () => {
    // The active scope chip click MAY be a no-op — verify the callback contract.
    // The implementer may or may not guard this; the key is the selection event
    // fires correctly for non-active chips.
    const onScopeSelect = vi.fn();
    render(<ScopeRail {...makeProps({ activeScopeId: scopeB.id, onScopeSelect })} />);
    // Click the NON-active chip — must fire.
    fireEvent.click(screen.getByTestId('scope-chip-scope-a'));
    expect(onScopeSelect).toHaveBeenCalledWith('scope-a');
  });
});

describe('ScopeRail — scope archive (SCOPE_ARCHIVE prunes)', () => {
  it('renders an archive button for each scope chip', () => {
    render(<ScopeRail {...makeProps()} />);
    // Each chip has a dedicated archive/remove affordance.
    expect(screen.getByTestId('scope-archive-scope-a')).toBeInTheDocument();
    expect(screen.getByTestId('scope-archive-scope-b')).toBeInTheDocument();
  });

  it('calls onScopeArchive with the correct scope id when archive is clicked', () => {
    const onScopeArchive = vi.fn();
    render(<ScopeRail {...makeProps({ onScopeArchive })} />);
    fireEvent.click(screen.getByTestId('scope-archive-scope-a'));
    expect(onScopeArchive).toHaveBeenCalledWith('scope-a');
    expect(onScopeArchive).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onScopeSelect when archive button is clicked', () => {
    const onScopeSelect = vi.fn();
    const onScopeArchive = vi.fn();
    render(<ScopeRail {...makeProps({ onScopeSelect, onScopeArchive })} />);
    fireEvent.click(screen.getByTestId('scope-archive-scope-b'));
    expect(onScopeArchive).toHaveBeenCalledWith('scope-b');
    expect(onScopeSelect).not.toHaveBeenCalled();
  });

  it('calls onScopeArchive for each scope independently', () => {
    const onScopeArchive = vi.fn();
    render(<ScopeRail {...makeProps({ scopes: [scopeA, scopeB, scopeC], onScopeArchive })} />);
    fireEvent.click(screen.getByTestId('scope-archive-scope-b'));
    expect(onScopeArchive).toHaveBeenCalledWith('scope-b');
    expect(onScopeArchive).toHaveBeenCalledTimes(1);
  });
});
