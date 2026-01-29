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
import * as licenseModule from '../license';

describe('edition module', () => {
  beforeEach(() => {
    // Reset edition configuration before each test
    configureEdition(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configureEdition', () => {
    it('should accept community edition', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
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
      // Without a license, should default to community
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
      expect(getEdition()).toBe('community');
    });
  });

  describe('getEdition', () => {
    it('should return licensed when configured as licensed', () => {
      configureEdition('licensed');
      expect(getEdition()).toBe('licensed');
    });

    it('should return licensed when has valid license (even if not configured)', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(true);
      configureEdition(null);
      expect(getEdition()).toBe('licensed');
    });

    it('should return community when no config and no license', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
      configureEdition(null);
      expect(getEdition()).toBe('community');
    });

    it('should return licensed even with community config when license check returns true', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(true);
      configureEdition('community');
      // Community config but valid license -> still licensed
      expect(getEdition()).toBe('licensed');
    });
  });

  describe('shouldShowBranding', () => {
    it('should return true for community edition', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
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
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
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
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
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
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
      configureEdition(null);
      expect(isThemingEnabled()).toBe(false);
    });

    it('should return true when user activates license in community build', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(true);
      configureEdition(null);
      expect(isThemingEnabled()).toBe(true);
    });
  });

  describe('edition hierarchy', () => {
    it('should prioritize licensed config over license check', () => {
      vi.spyOn(licenseModule, 'hasValidLicense').mockReturnValue(false);
      configureEdition('licensed');
      // Licensed config is honored even without stored license
      expect(getEdition()).toBe('licensed');
    });
  });
});
