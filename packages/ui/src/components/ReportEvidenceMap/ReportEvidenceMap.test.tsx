import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ReportEvidenceMap } from './ReportEvidenceMap';

const timeline = {
  frames: [
    {
      timestamp: '2026-06-08T00:00:00.000Z',
      label: 'Jun 8',
      visibleFactors: ['Shift'],
      visibleLinks: ['link-1'],
      visibleHubs: ['hub-1'],
    },
  ],
  currentFrame: 0,
  progress: 0.5,
  isPlaying: false,
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
};

describe('ReportEvidenceMap', () => {
  it('renders the read-only Evidence Map child with timeline controls', () => {
    render(
      <ReportEvidenceMap
        evidenceMap={<div data-testid="report-evidence-map-child" />}
        timeline={timeline}
      />
    );

    expect(screen.getByTestId('report-evidence-map-child')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();
    expect(screen.getByText('Jun 8')).toBeInTheDocument();
  });

  it('does not render an empty timeline', () => {
    const { container } = render(
      <ReportEvidenceMap
        evidenceMap={<div data-testid="report-evidence-map-child" />}
        timeline={{ ...timeline, frames: [] }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
