import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScopeCoverageBar } from '../ScopeCoverageBar';

/**
 * ScopeCoverageBar (IM-5, eda §3.3 reinterpreted) — a descriptive coverage-%
 * bar banded blue(<30)/amber(30–50)/green(>50), with the What-If projected Cpk
 * surfaced as accompanying TEXT. Neither value is a multiplied-η² chain:
 * coverage is a prevalence count, the Cpk text is a What-If simulation result.
 */
describe('ScopeCoverageBar — banding', () => {
  it('uses the blue band below 30%', () => {
    render(<ScopeCoverageBar coverage={12} />);
    const fill = screen.getByTestId('scope-coverage-fill');
    expect(fill.className).toContain('bg-blue-500');
    expect(fill.style.width).toBe('12%');
  });

  it('uses the amber band in [30, 50]', () => {
    render(<ScopeCoverageBar coverage={40} />);
    const fill = screen.getByTestId('scope-coverage-fill');
    expect(fill.className).toContain('bg-amber-500');
  });

  it('uses the amber band at the lower 30% boundary', () => {
    render(<ScopeCoverageBar coverage={30} />);
    expect(screen.getByTestId('scope-coverage-fill').className).toContain('bg-amber-500');
  });

  it('uses the green band above 50%', () => {
    render(<ScopeCoverageBar coverage={72} />);
    const fill = screen.getByTestId('scope-coverage-fill');
    expect(fill.className).toContain('bg-green-500');
  });

  it('uses the green band just above the 50% boundary', () => {
    render(<ScopeCoverageBar coverage={50.1} />);
    expect(screen.getByTestId('scope-coverage-fill').className).toContain('bg-green-500');
  });

  it('treats exactly 50% as amber (not yet green)', () => {
    render(<ScopeCoverageBar coverage={50} />);
    expect(screen.getByTestId('scope-coverage-fill').className).toContain('bg-amber-500');
  });

  it('clamps the fill width to [0, 100]', () => {
    const { rerender } = render(<ScopeCoverageBar coverage={140} />);
    expect(screen.getByTestId('scope-coverage-fill').style.width).toBe('100%');
    rerender(<ScopeCoverageBar coverage={-5} />);
    expect(screen.getByTestId('scope-coverage-fill').style.width).toBe('0%');
  });

  it('renders the coverage percentage label', () => {
    render(<ScopeCoverageBar coverage={37.4} />);
    expect(screen.getByTestId('scope-coverage-bar').textContent).toContain('37%');
  });
});

describe('ScopeCoverageBar — What-If projected Cpk text', () => {
  it('renders "if fixed: Cpk X → Y" when both current and projected Cpk are given', () => {
    render(<ScopeCoverageBar coverage={45} currentCpk={0.7} whatIfCpk={1.2} />);
    const text = screen.getByTestId('scope-whatif-text').textContent ?? '';
    expect(text).toContain('0.7');
    expect(text).toContain('1.2');
    expect(text.toLowerCase()).toContain('if fixed');
  });

  it('renders just the projected Cpk when the current Cpk is unknown', () => {
    render(<ScopeCoverageBar coverage={45} whatIfCpk={1.2} />);
    const text = screen.getByTestId('scope-whatif-text').textContent ?? '';
    expect(text).toContain('1.2');
  });

  it('omits the What-If text entirely when no projection is available', () => {
    render(<ScopeCoverageBar coverage={45} />);
    expect(screen.queryByTestId('scope-whatif-text')).toBeNull();
  });
});

describe('ScopeCoverageBar — no-data case', () => {
  it('renders nothing when coverage is null/undefined', () => {
    const { container } = render(<ScopeCoverageBar coverage={null} />);
    expect(container.firstChild).toBeNull();
  });
});
