import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { SurveyInboxPrompt } from '@variscout/core/survey';
import { InboxDigest } from '../InboxDigest';

const prompts: SurveyInboxPrompt[] = [
  {
    id: 'inbox:sustainment-drift:sustain-1',
    severity: 'critical',
    message: 'Sustainment drift detected for reject-rate control.',
    action: { label: 'Review sustainment', opensSurface: 'sustainment', opensId: 'sustain-1' },
    sourceHint: {
      kind: 'drift-detection',
      severity: 'critical',
      surface: 'inbox',
      targetEntityId: 'sustain-1',
      message: 'Sustainment drift detected for reject-rate control.',
      action: {
        label: 'Review sustainment',
        opensSurface: 'sustainment',
        opensId: 'sustain-1',
      },
    },
  },
  {
    id: 'inbox:sustainment-due:sustain-2',
    severity: 'warning',
    message: 'Weekly sustainment review is due.',
    sourceHint: {
      kind: 'lifecycle-gap',
      severity: 'warning',
      surface: 'inbox',
      targetEntityId: 'sustain-2',
      message: 'Weekly sustainment review is due.',
    },
  },
];

describe('InboxDigest', () => {
  it('renders prompt count, severity, message, and navigates from CTA', () => {
    const onNavigate = vi.fn();
    render(<InboxDigest prompts={prompts} onNavigate={onNavigate} />);

    expect(screen.getByText('2 prompts')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
    expect(
      screen.getByText('Sustainment drift detected for reject-rate control.')
    ).toBeInTheDocument();
    expect(screen.getByText('Weekly sustainment review is due.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review sustainment' }));

    expect(onNavigate).toHaveBeenCalledWith(prompts[0]);
  });

  it('renders compactly when there are no prompts', () => {
    const { container } = render(<InboxDigest prompts={[]} onNavigate={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
