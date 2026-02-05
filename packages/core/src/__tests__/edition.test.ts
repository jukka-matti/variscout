/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  configureEdition,
  getEdition,
  shouldShowBranding,
  getBrandingText,
  getSignatureText,
  isThemingEnabled,
} from '../edition';
import * as tierModule from '../tier';

describe('edition module', () => {
  beforeEach(() => {
    // Reset edition configuration before each test
    configureEdition(null);
    // Reset tier to default (free)
    vi.spyOn(tierModule, 'getTier').mockReturnValue('free');
    vi.spyOn(tierModule, 'isPaidTier').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configureEdition', () => {
    it('should accept community edition', () => {
      configureEdition('community');
      expect(getEdition()).toBe('community');
    });

    it('should accept licensed edition', () => {
      configureEdition('licensed');
      expect(getEdition()).toBe('licensed');
    });

    it('should accept null to reset', () => {
      configureEdition('licensed');
      configureEdition(null);
      // Without a paid tier, should default to community
      expect(getEdition()).toBe('community');
    });
  });

  describe('getEdition', () => {
    it('should return licensed when configured as licensed', () => {
      configureEdition('licensed');
      expect(getEdition()).toBe('licensed');
    });

    it('should return licensed when tier is paid', () => {
      vi.spyOn(tierModule, 'getTier').mockReturnValue('individual');
      vi.spyOn(tierModule, 'isPaidTier').mockReturnValue(true);
      configureEdition(null);
      expect(getEdition()).toBe('licensed');
    });

    it('should return community when no config and free tier', () => {
      configureEdition(null);
      expect(getEdition()).toBe('community');
    });

    it('should prioritize paid tier over community config', () => {
      vi.spyOn(tierModule, 'getTier').mockReturnValue('team');
      vi.spyOn(tierModule, 'isPaidTier').mockReturnValue(true);
      configureEdition('community');
      // Paid tier takes precedence
      expect(getEdition()).toBe('licensed');
    });
  });

  describe('shouldShowBranding', () => {
    it('should return true for community edition', () => {
      configureEdition(null);
      expect(shouldShowBranding()).toBe(true);
    });

    it('should return false for licensed edition', () => {
      configureEdition('licensed');
      expect(shouldShowBranding()).toBe(false);
    });
  });

  describe('getBrandingText', () => {
    it('should return VariScout Lite for community', () => {
      configureEdition(null);
      expect(getBrandingText()).toBe('VariScout Lite');
    });

    it('should return empty string for licensed', () => {
      configureEdition('licensed');
      expect(getBrandingText()).toBe('');
    });
  });

  describe('getSignatureText', () => {
    it('should return VariScout for community', () => {
      configureEdition(null);
      expect(getSignatureText()).toBe('VariScout');
    });

    it('should return empty string for licensed', () => {
      configureEdition('licensed');
      expect(getSignatureText()).toBe('');
    });
  });

  describe('isThemingEnabled', () => {
    it('should return true for licensed edition', () => {
      configureEdition('licensed');
      expect(isThemingEnabled()).toBe(true);
    });

    it('should return false for community edition', () => {
      configureEdition(null);
      expect(isThemingEnabled()).toBe(false);
    });

    it('should return true when paid tier is active', () => {
      vi.spyOn(tierModule, 'getTier').mockReturnValue('enterprise');
      vi.spyOn(tierModule, 'isPaidTier').mockReturnValue(true);
      configureEdition(null);
      expect(isThemingEnabled()).toBe(true);
    });
  });

  describe('edition hierarchy', () => {
    it('should prioritize licensed config even with free tier', () => {
      configureEdition('licensed');
      // Licensed config is honored even with free tier
      expect(getEdition()).toBe('licensed');
    });
  });
});
