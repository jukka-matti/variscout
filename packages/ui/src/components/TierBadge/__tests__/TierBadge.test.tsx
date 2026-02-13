/**
 * Tests for TierBadge component
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TierBadge } from '../index';

describe('TierBadge', () => {
  it('renders free tier badge', () => {
    render(<TierBadge tier="free" />);
    expect(screen.getByText('Free')).toBeDefined();
  });

  it('renders enterprise tier badge', () => {
    render(<TierBadge tier="enterprise" />);
    expect(screen.getByText('Enterprise')).toBeDefined();
  });

  it('uses custom description when provided', () => {
    render(<TierBadge tier="free" description="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeDefined();
  });

  it('renders upgrade link for free tier when upgradeUrl provided', () => {
    render(<TierBadge tier="free" upgradeUrl="https://example.com/upgrade" />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://example.com/upgrade');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('does not render upgrade link for paid tiers', () => {
    render(<TierBadge tier="enterprise" upgradeUrl="https://example.com/upgrade" />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('applies sm size classes by default', () => {
    const { container } = render(<TierBadge tier="free" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-xs');
  });

  it('applies md size classes when specified', () => {
    const { container } = render(<TierBadge tier="free" size="md" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-sm');
  });

  it('applies tier-specific color classes', () => {
    const { container: freeContainer } = render(<TierBadge tier="free" />);
    const freeBadge = freeContainer.querySelector('span');
    expect(freeBadge?.className).toContain('bg-slate-600/20');

    const { container: enterpriseContainer } = render(<TierBadge tier="enterprise" />);
    const enterpriseBadge = enterpriseContainer.querySelector('span');
    expect(enterpriseBadge?.className).toContain('bg-amber-600/20');
  });

  it('applies additional className', () => {
    const { container } = render(<TierBadge tier="free" className="extra-class" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('extra-class');
  });
});
