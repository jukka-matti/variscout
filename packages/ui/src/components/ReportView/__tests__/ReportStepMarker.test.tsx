import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReportStepMarker } from '../ReportStepMarker';

describe('ReportStepMarker', () => {
  describe('done status', () => {
    it('renders a checkmark (Check icon) for done status', () => {
      const { container } = render(<ReportStepMarker stepNumber={1} status="done" />);
      // Lucide Check icon renders an svg
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });

    it('does not render the step number for done status', () => {
      render(<ReportStepMarker stepNumber={3} status="done" />);
      expect(screen.queryByText('3')).toBeNull();
    });

    it('uses green background for done status', () => {
      const { container } = render(<ReportStepMarker stepNumber={1} status="done" />);
      const marker = container.firstChild as HTMLElement;
      expect(marker.className).toContain('bg-green-500');
    });
  });

  describe('active status', () => {
    it('renders the step number for active status', () => {
      render(<ReportStepMarker stepNumber={2} status="active" />);
      expect(screen.getByText('2')).toBeDefined();
    });

    it('uses blue background for active status', () => {
      const { container } = render(<ReportStepMarker stepNumber={2} status="active" />);
      const marker = container.firstChild as HTMLElement;
      expect(marker.className).toContain('bg-blue-500');
    });

    it('does not render an SVG icon for active status', () => {
      const { container } = render(<ReportStepMarker stepNumber={2} status="active" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeNull();
    });
  });

  describe('future status', () => {
    it('renders the step number for future status', () => {
      render(<ReportStepMarker stepNumber={5} status="future" />);
      expect(screen.getByText('5')).toBeDefined();
    });

    it('uses gray styling (border) for future status', () => {
      const { container } = render(<ReportStepMarker stepNumber={5} status="future" />);
      const marker = container.firstChild as HTMLElement;
      // Future uses border styling, not filled background
      expect(marker.className).toContain('border-slate-300');
    });

    it('does not use the active blue background for future status', () => {
      const { container } = render(<ReportStepMarker stepNumber={5} status="future" />);
      const marker = container.firstChild as HTMLElement;
      expect(marker.className).not.toContain('bg-blue-500');
    });
  });
});
