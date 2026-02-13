/**
 * Tests for tier module (VariScout two-tier licensing)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  TIER_LIMITS,
  CHANNEL_WARNING_THRESHOLD,
  DEFAULT_TIER,
  configureTier,
  getTier,
  isPaidTier,
  getMaxChannels,
  getTierLimits,
  isChannelLimitExceeded,
  shouldShowChannelWarning,
  validateChannelCount,
  getTierDescription,
  getUpgradeUrl,
  type LicenseTier,
} from '../tier';

describe('tier module', () => {
  // Reset tier configuration before each test
  beforeEach(() => {
    configureTier(null);
  });

  describe('TIER_LIMITS constants', () => {
    it('should define limits for all tiers', () => {
      expect(TIER_LIMITS.free).toBeDefined();
      expect(TIER_LIMITS.enterprise).toBeDefined();
    });

    it('should have free tier limited to 5 channels', () => {
      expect(TIER_LIMITS.free.maxChannels).toBe(5);
    });

    it('should have enterprise tier limited to 1500 channels', () => {
      expect(TIER_LIMITS.enterprise.maxChannels).toBe(1500);
    });
  });

  describe('CHANNEL_WARNING_THRESHOLD', () => {
    it('should be 700', () => {
      expect(CHANNEL_WARNING_THRESHOLD).toBe(700);
    });
  });

  describe('DEFAULT_TIER', () => {
    it('should be free', () => {
      expect(DEFAULT_TIER).toBe('free');
    });
  });

  describe('configureTier / getTier', () => {
    it('should return default tier when not configured', () => {
      expect(getTier()).toBe('free');
    });

    it('should return configured tier', () => {
      configureTier('enterprise');
      expect(getTier()).toBe('enterprise');
    });

    it('should reset to default when configured with null', () => {
      configureTier('enterprise');
      expect(getTier()).toBe('enterprise');

      configureTier(null);
      expect(getTier()).toBe('free');
    });
  });

  describe('isPaidTier', () => {
    it('should return false for free tier', () => {
      expect(isPaidTier('free')).toBe(false);
    });

    it('should return true for enterprise tier', () => {
      expect(isPaidTier('enterprise')).toBe(true);
    });

    it('should use current tier when no argument provided', () => {
      configureTier('free');
      expect(isPaidTier()).toBe(false);

      configureTier('enterprise');
      expect(isPaidTier()).toBe(true);
    });
  });

  describe('getMaxChannels', () => {
    it('should return 5 for free tier', () => {
      expect(getMaxChannels('free')).toBe(5);
    });

    it('should return 1500 for enterprise tier', () => {
      expect(getMaxChannels('enterprise')).toBe(1500);
    });

    it('should use current tier when no argument provided', () => {
      configureTier('free');
      expect(getMaxChannels()).toBe(5);

      configureTier('enterprise');
      expect(getMaxChannels()).toBe(1500);
    });
  });

  describe('getTierLimits', () => {
    it('should return full limits object', () => {
      const limits = getTierLimits('enterprise');
      expect(limits).toEqual({ maxChannels: 1500 });
    });

    it('should use current tier when no argument provided', () => {
      configureTier('enterprise');
      const limits = getTierLimits();
      expect(limits).toEqual({ maxChannels: 1500 });
    });
  });

  describe('isChannelLimitExceeded', () => {
    it('should return false when under limit', () => {
      expect(isChannelLimitExceeded(3, 'free')).toBe(false);
      expect(isChannelLimitExceeded(1000, 'enterprise')).toBe(false);
    });

    it('should return false when at limit', () => {
      expect(isChannelLimitExceeded(5, 'free')).toBe(false);
      expect(isChannelLimitExceeded(1500, 'enterprise')).toBe(false);
    });

    it('should return true when over limit', () => {
      expect(isChannelLimitExceeded(6, 'free')).toBe(true);
      expect(isChannelLimitExceeded(1501, 'enterprise')).toBe(true);
    });

    it('should use current tier when no argument provided', () => {
      configureTier('free');
      expect(isChannelLimitExceeded(6)).toBe(true);
      expect(isChannelLimitExceeded(5)).toBe(false);

      configureTier('enterprise');
      expect(isChannelLimitExceeded(6)).toBe(false);
      expect(isChannelLimitExceeded(1501)).toBe(true);
    });
  });

  describe('shouldShowChannelWarning', () => {
    it('should return false when below threshold', () => {
      expect(shouldShowChannelWarning(699)).toBe(false);
      expect(shouldShowChannelWarning(0)).toBe(false);
      expect(shouldShowChannelWarning(100)).toBe(false);
    });

    it('should return true when at or above threshold', () => {
      expect(shouldShowChannelWarning(700)).toBe(true);
      expect(shouldShowChannelWarning(1000)).toBe(true);
      expect(shouldShowChannelWarning(1500)).toBe(true);
    });
  });

  describe('validateChannelCount', () => {
    it('should return correct result when under limit', () => {
      const result = validateChannelCount(3, 'free');
      expect(result).toEqual({
        exceeded: false,
        current: 3,
        max: 5,
        showWarning: false,
      });
    });

    it('should return exceeded=true when over limit', () => {
      const result = validateChannelCount(6, 'free');
      expect(result).toEqual({
        exceeded: true,
        current: 6,
        max: 5,
        showWarning: false,
      });
    });

    it('should show warning when at threshold but not exceeded', () => {
      const result = validateChannelCount(700, 'enterprise');
      expect(result).toEqual({
        exceeded: false,
        current: 700,
        max: 1500,
        showWarning: true,
      });
    });

    it('should not show warning when exceeded', () => {
      // Even if above warning threshold, don't show warning if exceeded
      const result = validateChannelCount(10, 'free');
      expect(result.exceeded).toBe(true);
      expect(result.showWarning).toBe(false);
    });

    it('should not show warning for free tier at low counts', () => {
      // Free tier has max 5, so warning threshold (700) never applies
      const result = validateChannelCount(4, 'free');
      expect(result.showWarning).toBe(false);
    });

    it('should use current tier when no argument provided', () => {
      configureTier('enterprise');
      const result = validateChannelCount(1000);
      expect(result.max).toBe(1500);
    });
  });

  describe('getTierDescription', () => {
    it('should return correct descriptions', () => {
      expect(getTierDescription('free')).toBe('Free (Demo)');
      expect(getTierDescription('enterprise')).toBe('Enterprise');
    });

    it('should use current tier when no argument provided', () => {
      configureTier('enterprise');
      expect(getTierDescription()).toBe('Enterprise');
    });
  });

  describe('getUpgradeUrl', () => {
    it('should return Azure Marketplace URL', () => {
      const url = getUpgradeUrl();
      expect(url).toContain('azuremarketplace.microsoft.com');
      expect(url).toContain('variscout');
    });
  });

  describe('tier integration scenarios', () => {
    it('should handle free tier demo scenario', () => {
      configureTier('free');

      // User can analyze up to 5 channels
      expect(isChannelLimitExceeded(5)).toBe(false);

      // User cannot analyze 6+ channels
      expect(isChannelLimitExceeded(6)).toBe(true);

      // No performance warning for free tier (max is too low)
      expect(validateChannelCount(5).showWarning).toBe(false);
    });

    it('should handle enterprise tier large dataset scenario', () => {
      configureTier('enterprise');

      // User can analyze many channels
      expect(isChannelLimitExceeded(500)).toBe(false);

      // Performance warning at 700+
      expect(validateChannelCount(700).showWarning).toBe(true);
      expect(validateChannelCount(1000).showWarning).toBe(true);

      // Still allowed up to 1500
      expect(isChannelLimitExceeded(1500)).toBe(false);

      // Blocked at 1501
      expect(isChannelLimitExceeded(1501)).toBe(true);
    });

    it('should correctly map tier to paid status', () => {
      const tiers: LicenseTier[] = ['free', 'enterprise'];
      const expectedPaid = [false, true];

      tiers.forEach((tier, i) => {
        expect(isPaidTier(tier)).toBe(expectedPaid[i]);
      });
    });
  });
});
