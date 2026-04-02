import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerificationSection } from '../VerificationSection';
import type { VerificationData } from '../VerificationSection';

const sampleVerification: VerificationData = {
  cpkBefore: 0.62,
  cpkAfter: 1.28,
  passRateBefore: 72,
  passRateAfter: 96,
  meanShift: -1.8,
  sigmaRatio: 0.72,
  dataDate: '2026-04-02T00:00:00.000Z',
};

describe('VerificationSection', () => {
  it('renders empty state when no verification data', () => {
    render(<VerificationSection />);
    expect(screen.getByTestId('verification-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/No verification data yet/i)).toBeInTheDocument();
  });

  it('shows "Add verification data" button in empty state', () => {
    const onAdd = vi.fn();
    render(<VerificationSection onAddVerificationData={onAdd} />);
    expect(screen.getByTestId('add-verification-btn')).toBeInTheDocument();
  });

  it('calls onAddVerificationData when button clicked', () => {
    const onAdd = vi.fn();
    render(<VerificationSection onAddVerificationData={onAdd} />);
    fireEvent.click(screen.getByTestId('add-verification-btn'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('renders KPI grid when verification data provided', () => {
    render(<VerificationSection verification={sampleVerification} />);
    expect(screen.getByTestId('verification-data')).toBeInTheDocument();
    expect(screen.queryByTestId('verification-empty-state')).not.toBeInTheDocument();
  });

  it('shows Cpk before and after values', () => {
    render(<VerificationSection verification={sampleVerification} />);
    const cpkCard = screen.getByTestId('verification-cpk');
    expect(cpkCard).toHaveTextContent('0.62');
    expect(screen.getByTestId('verification-cpk-after')).toHaveTextContent('1.28');
  });

  it('colors Cpk green when improved (after > before)', () => {
    render(<VerificationSection verification={sampleVerification} />);
    const cpkAfter = screen.getByTestId('verification-cpk-after');
    expect(cpkAfter.className).toContain('text-green-400');
  });

  it('colors Cpk red when worse (after < before)', () => {
    render(
      <VerificationSection
        verification={{ ...sampleVerification, cpkAfter: 0.4, cpkBefore: 0.62 }}
      />
    );
    const cpkAfter = screen.getByTestId('verification-cpk-after');
    expect(cpkAfter.className).toContain('text-red-400');
  });

  it('shows data date', () => {
    render(<VerificationSection verification={sampleVerification} />);
    expect(screen.getByTestId('verification-data-date')).toBeInTheDocument();
    // Should include "Apr 2" or similar formatted date
    expect(screen.getByTestId('verification-data-date').textContent).toContain('data');
  });

  it('calls onViewStagedCharts when link clicked', () => {
    const onView = vi.fn();
    render(<VerificationSection verification={sampleVerification} onViewStagedCharts={onView} />);
    fireEvent.click(screen.getByTestId('view-staged-charts-btn'));
    expect(onView).toHaveBeenCalledTimes(1);
  });

  it('does not show Add button when onAddVerificationData is not provided', () => {
    render(<VerificationSection />);
    expect(screen.queryByTestId('add-verification-btn')).not.toBeInTheDocument();
  });

  it('shows sigma ratio with green color when ratio < 1', () => {
    render(<VerificationSection verification={sampleVerification} />);
    const sigmaRatio = screen.getByTestId('verification-sigma-ratio-value');
    expect(sigmaRatio.className).toContain('text-green-400');
    expect(sigmaRatio).toHaveTextContent('0.72');
  });

  it('shows sigma ratio with red color when ratio > 1', () => {
    render(<VerificationSection verification={{ ...sampleVerification, sigmaRatio: 1.25 }} />);
    const sigmaRatio = screen.getByTestId('verification-sigma-ratio-value');
    expect(sigmaRatio.className).toContain('text-red-400');
  });
});
