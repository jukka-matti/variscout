import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportKPIGrid } from '../ReportKPIGrid';
import type { StatsResult, SpecLimits } from '@variscout/core';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockStats: StatsResult = {
  mean: 10.5,
  median: 10.3,
  stdDev: 1.2,
  sigmaWithin: 1.1,
  mrBar: 1.24,
  ucl: 13.8,
  lcl: 7.2,
  cpk: 1.45,
  cp: 1.5,
  outOfSpecPercentage: 2.1,
};

const emptySpecs: SpecLimits = {};
const specsSet: SpecLimits = { usl: 110, lsl: 90 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportKPIGrid', () => {
  it('renders all 5 KPI cards (Samples, Mean, Variation, Cpk, In Spec %)', () => {
    render(<ReportKPIGrid stats={mockStats} specs={specsSet} sampleCount={100} />);
    expect(screen.getByText('Samples')).toBeDefined();
    expect(screen.getByText('Mean')).toBeDefined();
    expect(screen.getByText('Variation (σ)')).toBeDefined();
    expect(screen.getByText('Cpk')).toBeDefined();
    expect(screen.getByText('In Spec %')).toBeDefined();
  });

  it('displays the sample count', () => {
    render(<ReportKPIGrid stats={mockStats} specs={specsSet} sampleCount={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('shows "—" for samples when sampleCount is undefined', () => {
    render(<ReportKPIGrid stats={mockStats} specs={emptySpecs} />);
    // The Samples value cell should show em dash
    expect(screen.getByText('—')).toBeDefined();
  });

  it('displays mean formatted to 2 decimal places', () => {
    render(<ReportKPIGrid stats={mockStats} specs={emptySpecs} />);
    expect(screen.getByText('10.50')).toBeDefined();
  });

  it('displays stdDev formatted to 3 decimal places', () => {
    render(<ReportKPIGrid stats={mockStats} specs={emptySpecs} />);
    expect(screen.getByText('1.200')).toBeDefined();
  });

  it('displays Cpk formatted to 2 decimal places', () => {
    render(<ReportKPIGrid stats={mockStats} specs={specsSet} />);
    expect(screen.getByText('1.45')).toBeDefined();
  });

  it('displays In-Spec % correctly (100 - outOfSpecPercentage)', () => {
    render(<ReportKPIGrid stats={mockStats} specs={specsSet} />);
    // outOfSpecPercentage is 2.1, so inSpec = 97.9
    expect(screen.getByText('97.9%')).toBeDefined();
  });

  describe('Cpk color coding', () => {
    it('shows green when Cpk >= cpkTarget (default 1.33)', () => {
      const { container } = render(<ReportKPIGrid stats={mockStats} specs={specsSet} />);
      // cpk is 1.45 >= 1.33, expect green
      const cpkValue = container.querySelector('.text-green-600, .text-green-400');
      expect(cpkValue).not.toBeNull();
    });

    it('shows red when Cpk < 1.0', () => {
      const lowCpkStats = { ...mockStats, cpk: 0.8 };
      const { container } = render(<ReportKPIGrid stats={lowCpkStats} specs={specsSet} />);
      const cpkValue = container.querySelector('.text-red-600, .text-red-400');
      expect(cpkValue).not.toBeNull();
    });

    it('shows amber when Cpk is between 1.0 and target (1.33)', () => {
      const midCpkStats = { ...mockStats, cpk: 1.1 };
      const { container } = render(<ReportKPIGrid stats={midCpkStats} specs={specsSet} />);
      const cpkValue = container.querySelector('.text-amber-600, .text-amber-400');
      expect(cpkValue).not.toBeNull();
    });

    it('shows "—" when Cpk is undefined (no specs)', () => {
      const noCpkStats = { ...mockStats, cpk: undefined };
      render(<ReportKPIGrid stats={noCpkStats} specs={specsSet} />);
      // Find the Cpk card value — it should show —
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBeGreaterThan(0);
    });

    it('uses custom cpkTarget for color decision', () => {
      // cpk 1.45 is below custom target of 1.67 → amber
      const { container } = render(
        <ReportKPIGrid stats={mockStats} specs={specsSet} cpkTarget={1.67} />
      );
      const cpkValue = container.querySelector('.text-amber-600, .text-amber-400');
      expect(cpkValue).not.toBeNull();
    });
  });

  describe('ReportKPIGrid specs gating', () => {
    it('hides Cpk and In-Spec% when no specs are set', () => {
      render(<ReportKPIGrid stats={mockStats} specs={emptySpecs} sampleCount={50} />);
      expect(screen.queryByText('Cpk')).not.toBeInTheDocument();
      expect(screen.queryByText(/in.*spec/i)).not.toBeInTheDocument();
    });

    it('shows Cpk when only USL is set (one-sided)', () => {
      render(<ReportKPIGrid stats={mockStats} specs={{ usl: 110 }} sampleCount={50} />);
      expect(screen.getByText('Cpk')).toBeInTheDocument();
    });

    it('shows In-Spec% when only USL is set (one-sided)', () => {
      render(<ReportKPIGrid stats={mockStats} specs={{ usl: 110 }} sampleCount={50} />);
      expect(screen.getByText('In Spec %')).toBeInTheDocument();
    });

    it('shows Cpk when only LSL is set (one-sided)', () => {
      render(<ReportKPIGrid stats={mockStats} specs={{ lsl: 90 }} sampleCount={50} />);
      expect(screen.getByText('Cpk')).toBeInTheDocument();
    });

    it('shows all 3 base cards when no specs set', () => {
      render(<ReportKPIGrid stats={mockStats} specs={emptySpecs} sampleCount={50} />);
      expect(screen.getByText('Samples')).toBeInTheDocument();
      expect(screen.getByText('Mean')).toBeInTheDocument();
      expect(screen.getByText('Variation (σ)')).toBeInTheDocument();
    });
  });
});
