import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IPOverviewReport } from '../IPOverviewReport';
import type { IPReportOverviewSection } from '@variscout/core';

const sections: IPReportOverviewSection[] = [
  { title: 'Executive summary', items: ['Fill Cpk lift is active.'] },
  { title: 'Where we started', items: ['Baseline Cpk was below target.'] },
  { title: 'What we aimed for', items: ['Outcome target: 1.33'] },
  { title: 'What we found + what we did', items: ['Night shift nozzle drift'] },
  { title: 'Did it work?', items: ['Sustainment holding · 4 ticks'] },
  { title: 'What we standardized + learned', items: ['Retune checklist'] },
  { title: "What's next", items: ['Continue cadence review'] },
];

describe('IPOverviewReport', () => {
  it('renders all D13 headings verbatim', () => {
    render(<IPOverviewReport sections={sections} causeRows={[]} />);

    for (const section of sections) {
      expect(screen.getByRole('heading', { name: section.title })).toBeInTheDocument();
    }
  });
});
