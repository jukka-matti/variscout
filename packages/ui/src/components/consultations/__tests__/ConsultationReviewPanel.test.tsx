/**
 * CL-4: ConsultationReviewPanel tests (TDD — written before the component).
 *
 * Tests verify:
 * 1. Pending insights render with Accept / Edit / Reject controls.
 * 2. Accept calls acceptInsight → the insight transitions to accepted (and a Finding appears).
 * 3. Reject → rejected, no Finding created.
 * 4. Anchored entity label shows when the question has an anchor.
 * 5. Accepted / rejected insights show their settled state (no controls shown again).
 * 6. Edit mode: edit text → save calls editInsight → text updated.
 *
 * Mock pattern: vi.mock BEFORE component imports (critical vitest rule).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// ── Mocks BEFORE component imports ──────────────────────────────────────────

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (n: number) => String(n),
    locale: 'en',
  }),
}));

// Mock the stores module — we'll control return values per test
vi.mock('@variscout/stores', () => ({
  useAnalyzeStore: vi.fn(),
}));

// ── Now import (after mocks are established) ─────────────────────────────────

import { useAnalyzeStore } from '@variscout/stores';
import { ConsultationReviewPanel } from '../ConsultationReviewPanel';
import type { Consultation, ProposedInsight } from '@variscout/core/consultations';
import type { Hypothesis } from '@variscout/core';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const CONSULTATION_ID = 'ccc-ccc-ccc';
const Q1_ID = 'q1q1-q1q1-q1q1';
const Q2_ID = 'q2q2-q2q2-q2q2';
const INSIGHT_PENDING_ID = 'ins-pending-001';
const INSIGHT_ACCEPTED_ID = 'ins-accepted-001';
const INSIGHT_REJECTED_ID = 'ins-rejected-001';
const FINDING_ID = 'finding-001';
const HYPOTHESIS_ID = 'hyp-001';

function makePendingInsight(overrides: Partial<ProposedInsight> = {}): ProposedInsight {
  return {
    id: INSIGHT_PENDING_ID,
    responseId: 'resp-001',
    questionId: Q1_ID,
    text: 'The oven is never preheated on Monday mornings.',
    kind: 'answer',
    status: 'pending',
    createdAt: 1000000,
    deletedAt: null,
    ...overrides,
  };
}

function makeConsultation(insights: ProposedInsight[] = []): Consultation {
  return {
    id: CONSULTATION_ID,
    title: 'Line 3 Monday drift',
    status: 'responses-imported',
    createdAt: 1000000,
    updatedAt: 1000000,
    deletedAt: null,
    viewSelection: [],
    questions: [
      {
        id: Q1_ID,
        text: 'Does Monday startup differ?',
        status: 'open',
        createdAt: 1000000,
        deletedAt: null,
        anchor: { kind: 'hypothesis', id: HYPOTHESIS_ID },
      },
      {
        id: Q2_ID,
        text: 'Is oven preheated?',
        status: 'open',
        createdAt: 1000000,
        deletedAt: null,
      },
    ],
    responses: [
      {
        id: 'resp-001',
        source: 'typed',
        respondentLabel: 'J. Operator',
        importedAt: 1718352000000,
        createdAt: 1000000,
        deletedAt: null,
      },
    ],
    proposedInsights: insights,
  };
}

// ---------------------------------------------------------------------------
// Store mock setup helper
// ---------------------------------------------------------------------------

function setupStoreMock({
  consultation,
  hypotheses = [],
  findings = [],
  acceptInsight = vi.fn(),
  rejectInsight = vi.fn(),
  editInsight = vi.fn(),
}: {
  consultation: Consultation;
  hypotheses?: Hypothesis[];
  findings?: import('@variscout/core').Finding[];
  acceptInsight?: ReturnType<typeof vi.fn>;
  rejectInsight?: ReturnType<typeof vi.fn>;
  editInsight?: ReturnType<typeof vi.fn>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(useAnalyzeStore).mockImplementation((selector?: (state: any) => unknown) => {
    const state = {
      consultations: [consultation],
      hypotheses,
      findings,
      acceptInsight,
      rejectInsight,
      editInsight,
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConsultationReviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Renders pending insights ─────────────────────────────────────────────

  it('renders pending insights with Accept, Edit, and Reject controls', () => {
    const consultation = makeConsultation([makePendingInsight()]);
    setupStoreMock({ consultation });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    // The insight text must be visible
    expect(screen.getByText('The oven is never preheated on Monday mornings.')).toBeDefined();

    // Controls must be present (button labels come from t() which returns the key)
    expect(screen.getByRole('button', { name: /consultation\.review\.accept/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /consultation\.review\.edit/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /consultation\.review\.reject/i })).toBeDefined();
  });

  // ── Accept calls acceptInsight → Finding appears ──────────────────────────

  it('calls acceptInsight when the Accept button is clicked', () => {
    const mockAccept = vi.fn(() => ({
      id: FINDING_ID,
      text: 'The oven is never preheated on Monday mornings.',
      evidenceType: 'expert' as const,
      status: 'observed' as const,
      context: { activeFilters: {}, cumulativeScope: null },
      createdAt: 1000000,
      deletedAt: null,
      statusChangedAt: 1000000,
      comments: [],
    }));

    const consultation = makeConsultation([makePendingInsight()]);
    setupStoreMock({ consultation, acceptInsight: mockAccept });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    const acceptBtn = screen.getByRole('button', { name: /consultation\.review\.accept/i });
    fireEvent.click(acceptBtn);

    expect(mockAccept).toHaveBeenCalledWith(CONSULTATION_ID, INSIGHT_PENDING_ID);
  });

  // ── Reject → rejected, no Finding ────────────────────────────────────────

  it('calls rejectInsight when the Reject button is clicked', () => {
    const mockReject = vi.fn();
    const consultation = makeConsultation([makePendingInsight()]);
    setupStoreMock({ consultation, rejectInsight: mockReject });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    const rejectBtn = screen.getByRole('button', { name: /consultation\.review\.reject/i });
    fireEvent.click(rejectBtn);

    expect(mockReject).toHaveBeenCalledWith(CONSULTATION_ID, INSIGHT_PENDING_ID);
  });

  // ── Anchored entity label ─────────────────────────────────────────────────

  it('shows the anchored hypothesis name when the question has an anchor', () => {
    const consultation = makeConsultation([makePendingInsight({ questionId: Q1_ID })]);
    const hypotheses: Hypothesis[] = [
      {
        id: HYPOTHESIS_ID,
        name: 'warm-up variation',
        synthesis: '',
        status: 'proposed',
        findingIds: [],
        ideas: [],
        createdAt: 1000000,
        updatedAt: 1000000,
        deletedAt: null,
      },
    ];
    setupStoreMock({ consultation, hypotheses });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    // The anchor label must be visible in the rendered output (via data-testid)
    const anchorEl = screen.getByTestId('anchor-label');
    expect(anchorEl.textContent).toBe('warm-up variation');
  });

  // ── No anchor label when no anchor ───────────────────────────────────────

  it('does NOT show anchored label when the question has no anchor', () => {
    const consultation = makeConsultation([
      makePendingInsight({ questionId: Q2_ID }), // Q2 has no anchor
    ]);
    setupStoreMock({ consultation });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    // The "anchored to:" key should not appear at all
    expect(screen.queryByText(/consultation\.review\.anchoredTo/)).toBeNull();
  });

  // ── Accepted insights show accepted state ─────────────────────────────────

  it('shows accepted state badge for accepted insights (no action buttons)', () => {
    const acceptedInsight = makePendingInsight({
      id: INSIGHT_ACCEPTED_ID,
      status: 'accepted',
      acceptedAs: { kind: 'finding', id: FINDING_ID },
    });
    const consultation = makeConsultation([acceptedInsight]);
    setupStoreMock({ consultation });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    // Accepted badge must be shown
    expect(screen.getByText(/consultation\.review\.accepted/i)).toBeDefined();

    // Action buttons must NOT be shown for an accepted insight
    expect(screen.queryByRole('button', { name: /consultation\.review\.accept/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /consultation\.review\.reject/i })).toBeNull();
  });

  // ── Rejected insights show rejected state ────────────────────────────────

  it('shows rejected state badge for rejected insights (no action buttons)', () => {
    const rejectedInsight = makePendingInsight({
      id: INSIGHT_REJECTED_ID,
      status: 'rejected',
    });
    const consultation = makeConsultation([rejectedInsight]);
    setupStoreMock({ consultation });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    expect(screen.getByText(/consultation\.review\.rejected/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /consultation\.review\.accept/i })).toBeNull();
  });

  // ── Edit mode ─────────────────────────────────────────────────────────────

  it('entering edit mode shows a textarea; saving calls editInsight with updated text', () => {
    const mockEditInsight = vi.fn();
    const consultation = makeConsultation([makePendingInsight()]);
    setupStoreMock({ consultation, editInsight: mockEditInsight });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    // Click Edit
    const editBtn = screen.getByRole('button', { name: /consultation\.review\.edit/i });
    fireEvent.click(editBtn);

    // Textarea should appear
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDefined();

    // Change the text
    fireEvent.change(textarea, { target: { value: 'Corrected insight text.' } });

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /consultation\.review\.save/i });
    fireEvent.click(saveBtn);

    expect(mockEditInsight).toHaveBeenCalledWith(
      CONSULTATION_ID,
      INSIGHT_PENDING_ID,
      'Corrected insight text.'
    );
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  it('shows empty state when there are no insights', () => {
    const consultation = makeConsultation([]);
    setupStoreMock({ consultation });

    render(<ConsultationReviewPanel consultationId={CONSULTATION_ID} />);

    expect(screen.getByText(/consultation\.review\.empty/)).toBeDefined();
  });

  // ── Returns null for unknown consultationId ───────────────────────────────

  it('renders nothing when the consultationId is not found in the store', () => {
    const consultation = makeConsultation([makePendingInsight()]);
    setupStoreMock({ consultation });

    const { container } = render(
      <ConsultationReviewPanel consultationId="unknown-id" />
    );

    expect(container.firstChild).toBeNull();
  });
});
