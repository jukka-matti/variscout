/**
 * Tests for HelpTooltip component
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
