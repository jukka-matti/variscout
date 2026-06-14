/**
 * CL-5b: ConsultationBuilder tests (TDD — written before the component).
 *
 * Tests verify:
 * 1. Adding a question appends a ConsultationQuestion to the active consultation.
 * 2. Removing a question drops it.
 * 3. Export: clicking Export calls exportConsultationPack once with the
 *    consultation + resolved views, then the consultation status becomes 'sent'.
 * 4. Import: feeding a duck-typed File calls importResponse and the resulting
 *    insight becomes a pending proposedInsight.
 * 5. A malformed import file surfaces a readable alert and does not crash.
 *
 * vi.mock() BEFORE component imports — testing.md invariant.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Mocks BEFORE component imports ──────────────────────────────────────────

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    formatStat: (n: number) => String(n),
    locale: 'en-US',
  }),
}));

// Mock the gated artifact module so we can assert the export call.
const exportConsultationPackMock = vi.fn();
vi.mock('@pwa-artifacts', () => ({
  exportConsultationPack: (...args: unknown[]) => exportConsultationPackMock(...args),
}));

// ── Now import (after mocks are established) ─────────────────────────────────

import { useAnalyzeStore } from '@variscout/stores';
import { ConsultationBuilder } from '../ConsultationBuilder';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useAnalyzeStore.setState(
    (useAnalyzeStore as unknown as { getInitialState: () => object }).getInitialState()
  );
}

/** Duck-typed File with a synchronous text() promise. */
function fakeFile(name: string, content: string): File {
  return {
    name,
    text: () => Promise.resolve(content),
  } as unknown as File;
}

const VIEWS = [
  {
    kind: 'condition' as const,
    label: 'Day_of_Week = Monday',
    statsText: 'Cpk 0.77 · 12 events',
  },
];

beforeEach(() => {
  resetStore();
  exportConsultationPackMock.mockReset();
});

describe('ConsultationBuilder', () => {
  it('renders a builder panel', () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    expect(screen.getByTestId('consultation-builder-panel')).toBeTruthy();
  });

  it('creates an active consultation when first mounted (no consultation exists)', () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    expect(useAnalyzeStore.getState().consultations.length).toBe(1);
  });

  it('adding a question appends it to the active consultation', () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));
    const inputs = screen.getAllByPlaceholderText('consultation.builder.questionPlaceholder');
    expect(inputs.length).toBe(1);
    const consultation = useAnalyzeStore.getState().consultations[0];
    expect(consultation.questions.length).toBe(1);
  });

  it('removing a question drops it', () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));
    expect(useAnalyzeStore.getState().consultations[0].questions.length).toBe(1);
    fireEvent.click(screen.getByLabelText('consultation.builder.removeQuestion'));
    expect(useAnalyzeStore.getState().consultations[0].questions.length).toBe(0);
  });

  it('summarizes the views that will be included', () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    expect(screen.getByText('Day_of_Week = Monday')).toBeTruthy();
  });

  it('Export calls exportConsultationPack once with consultation + views and marks it sent', async () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    const consultationId = useAnalyzeStore.getState().consultations[0].id;
    // M1: a non-blank question so Export is not blocked by the empty-pack guard.
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));
    fireEvent.change(
      screen.getByPlaceholderText('consultation.builder.questionPlaceholder'),
      { target: { value: 'Why is Monday slow?' } }
    );

    fireEvent.click(screen.getByText('consultation.builder.exportPack'));

    await waitFor(() => {
      expect(exportConsultationPackMock).toHaveBeenCalledTimes(1);
    });
    const arg = exportConsultationPackMock.mock.calls[0][0] as {
      consultation: { id: string };
      views: unknown[];
    };
    expect(arg.consultation.id).toBe(consultationId);
    expect(arg.views).toEqual(VIEWS);

    await waitFor(() => {
      expect(useAnalyzeStore.getState().consultations[0].status).toBe('sent');
    });
  });

  it('once sent, the Export button is hidden and a "Sent" badge shows', async () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));
    fireEvent.change(
      screen.getByPlaceholderText('consultation.builder.questionPlaceholder'),
      { target: { value: 'Why is Monday slow?' } }
    );

    fireEvent.click(screen.getByText('consultation.builder.exportPack'));
    await waitFor(() => {
      expect(useAnalyzeStore.getState().consultations[0].status).toBe('sent');
    });

    expect(screen.queryByText('consultation.builder.exportPack')).toBeNull();
    expect(screen.getByTestId('consultation-sent-badge')).toBeTruthy();
  });

  it('M1: Export is blocked with a hint when there is no non-blank question', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    // A blank-text question only — must not produce an exportable pack.
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));

    fireEvent.click(screen.getByText('consultation.builder.exportPack'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('consultation.builder.blockedNoQuestions');
    });
    expect(exportConsultationPackMock).not.toHaveBeenCalled();
    expect(useAnalyzeStore.getState().consultations[0].status).toBe('draft');
    vi.unstubAllGlobals();
  });

  it('M5: in the free channel the Export does nothing (no export, no status flip)', async () => {
    // Force the artifact gate false: clear the VITEST flag and set a non-test MODE
    // so isArtifactControlsEnabled() returns false at call time.
    vi.stubEnv('VITEST', '');
    vi.stubEnv('MODE', 'production');
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));
    fireEvent.change(
      screen.getByPlaceholderText('consultation.builder.questionPlaceholder'),
      { target: { value: 'Why is Monday slow?' } }
    );

    fireEvent.click(screen.getByText('consultation.builder.exportPack'));

    // Give any (would-be) async export a tick to settle.
    await Promise.resolve();
    expect(exportConsultationPackMock).not.toHaveBeenCalled();
    expect(useAnalyzeStore.getState().consultations[0].status).toBe('draft');
    vi.unstubAllEnvs();
  });

  it('Import feeds importResponse → a pending insight appears', async () => {
    render(<ConsultationBuilder resolvedViews={VIEWS} />);
    const consultationId = useAnalyzeStore.getState().consultations[0].id;
    // Add a question so the response template has a matchable anchor.
    fireEvent.click(screen.getByText('consultation.builder.addQuestion'));
    const qId = useAnalyzeStore.getState().consultations[0].questions[0].id;

    const md = [
      `## Consultation ${consultationId} — responses`,
      `respondent: J. Operator`,
      ``,
      `### Q1 [id: ${qId}]`,
      `> The oven is never preheated on Monday mornings.`,
      ``,
    ].join('\n');

    const input = screen.getByTestId('consultation-import-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [fakeFile('response.md', md)] } });

    await waitFor(() => {
      const c = useAnalyzeStore.getState().consultations[0];
      expect(c.proposedInsights.length).toBe(1);
    });
    const insight = useAnalyzeStore.getState().consultations[0].proposedInsights[0];
    expect(insight.status).toBe('pending');
    expect(insight.text).toContain('oven');
  });

  it('a malformed import surfaces a readable alert and does not crash', async () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);
    render(<ConsultationBuilder resolvedViews={VIEWS} />);

    // .json route with non-JSON content → parseJsonResponse throws.
    const input = screen.getByTestId('consultation-import-input') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [fakeFile('broken.json', 'not json at all {{{')] },
    });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledTimes(1);
    });
    // Still rendered, no crash.
    expect(screen.getByTestId('consultation-builder-panel')).toBeTruthy();
    // No insight created.
    expect(useAnalyzeStore.getState().consultations[0].proposedInsights.length).toBe(0);
    vi.unstubAllGlobals();
  });
});
