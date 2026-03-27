/**
 * Tests for HelpTooltip component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@variscout/hooks', () => {
  const catalog: Record<string, string> = {
    'action.learnMore': 'Learn more',
  };
  return {
    useTranslation: () => ({
      t: (key: string) => catalog[key] ?? key,
      locale: 'en',
    }),
    useTooltipPosition: () => ({
      position: 'top',
      style: { position: 'fixed', top: 0, left: 0, visibility: 'visible' },
    }),
  };
});

import { HelpTooltip } from '../HelpTooltip';
import type { GlossaryTerm } from '@variscout/core';

const mockTerm: GlossaryTerm = {
  id: 'cpk',
  label: 'Cpk',
  definition: 'Process capability index that accounts for centering.',
  learnMorePath: '/glossary/cpk',
  category: 'capability',
};

describe('HelpTooltip', () => {
  it('renders nothing when no term is provided', () => {
    const { container } = render(<HelpTooltip />);
    expect(container.innerHTML).toBe('');
  });

  it('renders info icon when term is provided', () => {
    render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');
    expect(wrapper).toBeDefined();
    expect(wrapper.getAttribute('aria-label')).toBe('Help: Cpk');
  });

  it('shows tooltip content on hover', () => {
    render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');

    fireEvent.mouseEnter(wrapper);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.className).toContain('help-tooltip--visible');
    expect(screen.getByText('Cpk')).toBeDefined();
    expect(screen.getByText('Process capability index that accounts for centering.')).toBeDefined();
  });

  it('hides tooltip on mouse leave', () => {
    const { container } = render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByRole('tooltip').className).toContain('help-tooltip--visible');

    fireEvent.mouseLeave(wrapper);
    // After hide, aria-hidden="true" makes getByRole('tooltip') fail, so query directly
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip).not.toBeNull();
    expect(tooltip!.className).not.toContain('help-tooltip--visible');
  });

  it('shows tooltip on focus', () => {
    render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');

    fireEvent.focus(wrapper);
    expect(screen.getByRole('tooltip').className).toContain('help-tooltip--visible');
  });

  it('renders Learn more link when learnMorePath exists', () => {
    render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');
    fireEvent.mouseEnter(wrapper);

    const link = screen.getByText('Learn more →');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('https://variscout.com/glossary/cpk');
  });

  it('does not render Learn more when showLearnMore is false', () => {
    render(<HelpTooltip term={mockTerm} showLearnMore={false} />);
    const wrapper = screen.getByRole('button');
    fireEvent.mouseEnter(wrapper);

    expect(screen.queryByText('Learn more →')).toBeNull();
  });

  it('toggles tooltip on click (touch support)', () => {
    const { container } = render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');

    // Click to show
    fireEvent.click(wrapper);
    expect(screen.getByRole('tooltip').className).toContain('help-tooltip--visible');

    // Click again to hide
    fireEvent.click(wrapper);
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip!.className).not.toContain('help-tooltip--visible');
  });

  it('dismisses on click outside when touch-toggled', () => {
    const { container } = render(
      <div>
        <HelpTooltip term={mockTerm} />
        <button data-testid="outside">Outside</button>
      </div>
    );
    const wrapper = screen.getByRole('button', { name: /Help: Cpk/ });

    // Click to show
    fireEvent.click(wrapper);
    expect(screen.getByRole('tooltip').className).toContain('help-tooltip--visible');

    // Click outside to dismiss
    fireEvent.click(screen.getByTestId('outside'));
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip!.className).not.toContain('help-tooltip--visible');
  });

  it('dismisses touch-toggled tooltip on Escape', () => {
    const { container } = render(<HelpTooltip term={mockTerm} />);
    const wrapper = screen.getByRole('button');

    fireEvent.click(wrapper);
    expect(screen.getByRole('tooltip').className).toContain('help-tooltip--visible');

    fireEvent.keyDown(document, { key: 'Escape' });
    const tooltip = container.querySelector('[role="tooltip"]');
    expect(tooltip!.className).not.toContain('help-tooltip--visible');
  });

  it('has correct ARIA attributes', () => {
    render(<HelpTooltip term={mockTerm} termId="cpk" />);
    const wrapper = screen.getByRole('button');

    // Before hover: no aria-describedby
    expect(wrapper.getAttribute('aria-describedby')).toBeNull();

    // After hover: has aria-describedby
    fireEvent.mouseEnter(wrapper);
    expect(wrapper.getAttribute('aria-describedby')).toBe('help-tooltip-cpk');
  });
});
