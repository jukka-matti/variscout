/**
 * Tests for IdeaGroupCard component — evidence badge behaviour
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@variscout/hooks', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    tf: (key: string, _params: Record<string, unknown>) => key,
  }),
}));

import { render, screen } from '@testing-library/react';
import { IdeaGroupCard } from '../IdeaGroupCard';
import type { IdeaGroupCardProps } from '../IdeaGroupCard';

const baseQuestion: IdeaGroupCardProps['question'] = {
  id: 'q1',
  text: 'Shift (Night)',
  causeRole: 'suspected-cause',
};

describe('IdeaGroupCard — evidence badge', () => {
  it('shows R²adj badge when evidence.rSquaredAdj is provided', () => {
    render(<IdeaGroupCard question={baseQuestion} ideas={[]} evidence={{ rSquaredAdj: 0.34 }} />);
    const badge = screen.getByTestId('evidence-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('R²adj');
    expect(badge.textContent).toContain('34%');
  });

  it('rounds R²adj to nearest integer percentage', () => {
    render(<IdeaGroupCard question={baseQuestion} ideas={[]} evidence={{ rSquaredAdj: 0.345 }} />);
    const badge = screen.getByTestId('evidence-badge');
    // Math.round(0.345 * 100) = 35
    expect(badge.textContent).toContain('35%');
  });

  it('shows η² badge when only evidence.etaSquared is provided', () => {
    render(<IdeaGroupCard question={baseQuestion} ideas={[]} evidence={{ etaSquared: 0.21 }} />);
    const badge = screen.getByTestId('evidence-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('η²');
    expect(badge.textContent).toContain('21%');
  });

  it('prefers R²adj over η² when both are provided', () => {
    render(
      <IdeaGroupCard
        question={baseQuestion}
        ideas={[]}
        evidence={{ rSquaredAdj: 0.5, etaSquared: 0.3 }}
      />
    );
    const badge = screen.getByTestId('evidence-badge');
    expect(badge.textContent).toContain('R²adj');
    expect(badge.textContent).toContain('50%');
    expect(badge.textContent).not.toContain('η²');
  });

  it('shows no badge when evidence is not provided', () => {
    render(<IdeaGroupCard question={baseQuestion} ideas={[]} />);
    expect(screen.queryByTestId('evidence-badge')).toBeNull();
  });

  it('shows no badge when evidence is an empty object', () => {
    render(<IdeaGroupCard question={baseQuestion} ideas={[]} evidence={{}} />);
    expect(screen.queryByTestId('evidence-badge')).toBeNull();
  });

  it('renders badge alongside factor name and cause role badge', () => {
    render(
      <IdeaGroupCard
        question={{ ...baseQuestion, factor: 'Shift' }}
        ideas={[]}
        evidence={{ rSquaredAdj: 0.34 }}
      />
    );
    expect(screen.getByText('Shift (Night)')).toBeTruthy();
    // causeRole = 'suspected-cause' renders translation key 'question.primary'
    expect(screen.getByText('question.primary')).toBeTruthy();
    expect(screen.getByTestId('evidence-badge').textContent).toContain('R²adj 34%');
  });
});
