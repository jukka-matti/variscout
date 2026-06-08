/**
 * Tests for MissingEvidencePanel — rule-driven hint surface.
 *
 * Covers Task 19: 8 required cases per spec.
 * i18n pattern mirrors MiniIChart.test.tsx (no locale loader registration needed;
 * WallCanvas tests confirm the locale falls back to 'en' in jsdom).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SurveyHint } from '@variscout/core/survey';
import { MissingEvidencePanel } from '../MissingEvidencePanel';

const dataCollectionHint: SurveyHint = {
  kind: 'data-collection',
  surface: 'wall',
  targetEntityId: 'h1',
  message: 'Nozzle has data only — needs gemba or expert to triangulate',
  severity: 'info',
  action: { label: 'Try gemba evidence' },
};

const triangulationHint: SurveyHint = {
  kind: 'triangulation-readiness',
  surface: 'wall',
  targetEntityId: 'h2',
  message: '1 step away — running a disconfirmation test would let you mark this Supported',
  severity: 'info',
  action: { label: 'Try disconfirmation' },
};

const powerWarningHint: SurveyHint = {
  kind: 'power-warning',
  surface: 'wall',
  targetEntityId: 'h3',
  message: 'Sample size may be insufficient',
  severity: 'warning',
};

const lifecycleHint: SurveyHint = {
  kind: 'lifecycle-gap',
  surface: 'wall',
  targetEntityId: 'h4',
  message: 'Investigation stale — no activity in 14 days',
  severity: 'warning',
};

describe('MissingEvidencePanel', () => {
  it('1. renders nothing when hints array is empty', () => {
    const { container } = render(<MissingEvidencePanel hints={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('2. renders nothing when hints contain only irrelevant kinds (lifecycle-gap)', () => {
    const { container } = render(<MissingEvidencePanel hints={[lifecycleHint]} />);
    expect(container.firstChild).toBeNull();
  });

  it('3. renders data-collection hint — tagline shows (1)', () => {
    render(<MissingEvidencePanel hints={[dataCollectionHint]} />);
    expect(screen.getByLabelText(/Missing evidence digest/i)).toBeInTheDocument();
    // tagline has "(1)"
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('4. renders triangulation-readiness hint — panel visible', () => {
    render(<MissingEvidencePanel hints={[triangulationHint]} />);
    expect(screen.getByLabelText(/Missing evidence digest/i)).toBeInTheDocument();
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
  });

  it('5. both kinds together — tagline shows (2), expanding reveals both messages', () => {
    render(<MissingEvidencePanel hints={[dataCollectionHint, triangulationHint]} />);
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument();

    // Expand the section
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByText(/needs gemba or expert/i)).toBeInTheDocument();
    expect(screen.getByText(/disconfirmation test/i)).toBeInTheDocument();
  });

  it('6. filters out non-relevant kinds — power-warning excluded, data-collection shown', () => {
    render(<MissingEvidencePanel hints={[dataCollectionHint, powerWarningHint]} />);
    // tagline count = 1 (only data-collection passes the filter)
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument();

    // Expand and verify only the data-collection message appears
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText(/needs gemba or expert/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sample size may be insufficient/i)).not.toBeInTheDocument();
  });

  it('7. hub-link click — message renders as button, calls onFocusHub(targetEntityId)', () => {
    const onFocusHub = vi.fn();
    render(<MissingEvidencePanel hints={[dataCollectionHint]} onFocusHub={onFocusHub} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    // The hint message renders as a focusable button
    const msgButton = screen.getByText(/needs gemba or expert/i);
    expect(msgButton.tagName.toLowerCase()).toBe('button');
    fireEvent.click(msgButton);
    expect(onFocusHub).toHaveBeenCalledOnce();
    expect(onFocusHub).toHaveBeenCalledWith('h1');
  });

  it('8. action label rendered when hint has action.label', () => {
    render(<MissingEvidencePanel hints={[dataCollectionHint]} />);

    // Expand
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    // The action label text appears in the expanded list
    expect(screen.getByText('Try gemba evidence')).toBeInTheDocument();
  });

  it('9. FE-2b — the action button stays DISABLED when onTriadAction is omitted (legacy stub)', () => {
    render(<MissingEvidencePanel hints={[triangulationHint]} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    // The legacy disabled stub renders the label but no live action testid.
    expect(screen.getByText('Try disconfirmation')).toBeInTheDocument();
    expect(screen.queryByTestId('missing-evidence-action')).toBeNull();
  });

  it('10. FE-2b — the action button is ACTIVATED when onTriadAction is wired', () => {
    const onTriadAction = vi.fn();
    render(<MissingEvidencePanel hints={[triangulationHint]} onTriadAction={onTriadAction} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    fireEvent.click(screen.getByTestId('missing-evidence-action'));
    // Opens the targeted hub's test plan (the app routes this to focus the hub).
    expect(onTriadAction).toHaveBeenCalledWith('h2');
  });
});
