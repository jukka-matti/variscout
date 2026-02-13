/**
 * Tests for UpgradePrompt component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradePrompt } from '../index';

const defaultProps = {
  tier: 'free' as const,
  upgradeUrl: 'https://example.com/upgrade',
};

describe('UpgradePrompt', () => {
  describe('inline variant (default)', () => {
    it('renders upgrade title for free tier', () => {
      render(<UpgradePrompt {...defaultProps} />);
      expect(screen.getByText(/Upgrade to Unlock/)).toBeDefined();
    });

    it('renders limit reached title for paid tier', () => {
      render(<UpgradePrompt {...defaultProps} tier="enterprise" />);
      expect(screen.getByText(/Limit Reached/)).toBeDefined();
    });

    it('shows upgrade link for free tier', () => {
      render(<UpgradePrompt {...defaultProps} />);
      const link = screen.getByText('Upgrade now');
      expect(link.getAttribute('href')).toBe('https://example.com/upgrade');
    });

    it('does not show upgrade link for paid tier', () => {
      render(<UpgradePrompt {...defaultProps} tier="enterprise" />);
      expect(screen.queryByText('Upgrade now')).toBeNull();
    });

    it('shows channel count in message when provided', () => {
      render(<UpgradePrompt {...defaultProps} currentCount={10} maxAllowed={5} />);
      expect(screen.getByText(/You've selected 10/)).toBeDefined();
    });
  });

  describe('banner variant', () => {
    it('renders banner with upgrade button', () => {
      render(<UpgradePrompt {...defaultProps} variant="banner" />);
      expect(screen.getByText('Upgrade')).toBeDefined();
    });
  });

  describe('card variant', () => {
    it('renders card with view upgrade options button', () => {
      render(<UpgradePrompt {...defaultProps} variant="card" />);
      expect(screen.getByText('View Upgrade Options')).toBeDefined();
    });

    it('shows free tier limitation text', () => {
      render(<UpgradePrompt {...defaultProps} variant="card" />);
      expect(screen.getByText('Free tier limitation')).toBeDefined();
    });

    it('shows tier limit text for paid tiers', () => {
      render(<UpgradePrompt {...defaultProps} tier="enterprise" variant="card" />);
      expect(screen.getByText('Tier limit')).toBeDefined();
    });
  });

  describe('custom content', () => {
    it('uses custom title when provided', () => {
      render(<UpgradePrompt {...defaultProps} title="Custom Title" />);
      expect(screen.getByText(/Custom Title/)).toBeDefined();
    });

    it('uses custom message when provided', () => {
      render(<UpgradePrompt {...defaultProps} message="Custom message text" />);
      expect(screen.getByText(/Custom message text/)).toBeDefined();
    });

    it('uses custom feature name in message', () => {
      render(<UpgradePrompt {...defaultProps} feature="Regression Analysis" />);
      expect(screen.getByText(/Regression Analysis/)).toBeDefined();
    });
  });

  describe('callbacks', () => {
    it('calls onUpgradeClick when upgrade button clicked in banner', () => {
      const onUpgradeClick = vi.fn();
      render(<UpgradePrompt {...defaultProps} variant="banner" onUpgradeClick={onUpgradeClick} />);
      fireEvent.click(screen.getByText('Upgrade'));
      expect(onUpgradeClick).toHaveBeenCalledOnce();
    });
  });

  it('applies additional className', () => {
    const { container } = render(<UpgradePrompt {...defaultProps} className="extra-class" />);
    expect(container.firstElementChild?.className).toContain('extra-class');
  });
});
