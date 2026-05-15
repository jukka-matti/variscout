import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IPTechnicalReport, REPORT_METHODOLOGY_FOOTNOTE } from '../IPTechnicalReport';

describe('IPTechnicalReport', () => {
  it('renders the methodology footnote verbatim', () => {
    render(<IPTechnicalReport chartLabels={['Capability before', 'Capability after']} />);

    expect(screen.getByText(REPORT_METHODOLOGY_FOOTNOTE)).toBeInTheDocument();
  });
});
