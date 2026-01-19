/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isValidLicenseFormat,
  generateLicenseKey,
  storeLicenseKey,
  getStoredLicenseKey,
  removeLicenseKey,
  hasValidLicense,
} from '../license';

describe('license module', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isValidLicenseFormat', () => {
    it('should return false for empty string', () => {
      expect(isValidLicenseFormat('')).toBe(false);
    });

    it('should return false for invalid format (missing VSL prefix)', () => {
      expect(isValidLicenseFormat('ABC-1234-5678-9ABC')).toBe(false);
    });

    it('should return false for invalid format (wrong separators)', () => {
      expect(isValidLicenseFormat('VSL_1234_5678_9ABC')).toBe(false);
    });

    it('should return false for invalid format (too short)', () => {
      expect(isValidLicenseFormat('VSL-123-5678-9ABC')).toBe(false);
    });

    it('should return false for invalid format (too long)', () => {
      expect(isValidLicenseFormat('VSL-12345-5678-9ABC')).toBe(false);
    });

    it('should return false for invalid format (special characters)', () => {
      expect(isValidLicenseFormat('VSL-1234-5678-$ABC')).toBe(false);
    });

    it('should return false for valid format but invalid checksum', () => {
      // Random key with incorrect checksum
      expect(isValidLicenseFormat('VSL-AAAA-BBBB-XXXX')).toBe(false);
    });

    it('should return true for generated valid license key', () => {
      const key = generateLicenseKey();
      expect(isValidLicenseFormat(key)).toBe(true);
    });

    it('should be case-insensitive', () => {
      const key = generateLicenseKey();
      expect(isValidLicenseFormat(key.toLowerCase())).toBe(true);
    });

    it('should validate multiple generated keys', () => {
      // Generate 10 keys and verify all are valid
      for (let i = 0; i < 10; i++) {
        const key = generateLicenseKey();
        expect(isValidLicenseFormat(key)).toBe(true);
      }
    });
  });

  describe('generateLicenseKey', () => {
    it('should generate key with correct format', () => {
      const key = generateLicenseKey();
      expect(key).toMatch(/^VSL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    });

    it('should generate unique keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateLicenseKey());
      }
      // All 100 keys should be unique (very high probability)
      expect(keys.size).toBe(100);
    });

    it('should generate valid keys with correct checksum', () => {
      for (let i = 0; i < 10; i++) {
        const key = generateLicenseKey();
        expect(isValidLicenseFormat(key)).toBe(true);
      }
    });
  });

  describe('storeLicenseKey', () => {
    it('should store valid license key', () => {
      const key = generateLicenseKey();
      const result = storeLicenseKey(key);
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('variscout_license', key.toUpperCase());
    });

    it('should reject invalid license key', () => {
      const result = storeLicenseKey('invalid-key');
      expect(result).toBe(false);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should store key in uppercase', () => {
      const key = generateLicenseKey().toLowerCase();
      storeLicenseKey(key);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('variscout_license', key.toUpperCase());
    });

    it('should return false if localStorage throws', () => {
      const key = generateLicenseKey();
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = storeLicenseKey(key);
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getStoredLicenseKey', () => {
    it('should return stored license key', () => {
      const key = generateLicenseKey();
      localStorageMock.setItem('variscout_license', key);
      localStorageMock.getItem.mockReturnValueOnce(key);

      expect(getStoredLicenseKey()).toBe(key);
    });

    it('should return null if no key stored', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(getStoredLicenseKey()).toBe(null);
    });

    it('should return null if localStorage throws', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });
      expect(getStoredLicenseKey()).toBe(null);
    });
  });

  describe('removeLicenseKey', () => {
    it('should remove stored license key', () => {
      removeLicenseKey();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('variscout_license');
    });

    it('should not throw if localStorage throws', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Access denied');
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(() => removeLicenseKey()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('hasValidLicense', () => {
    it('should return false if no key stored', () => {
      localStorageMock.getItem.mockReturnValueOnce(null);
      expect(hasValidLicense()).toBe(false);
    });

    it('should return false if stored key is invalid', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid-key');
      expect(hasValidLicense()).toBe(false);
    });

    it('should return true if stored key is valid', () => {
      const key = generateLicenseKey();
      localStorageMock.getItem.mockReturnValueOnce(key);
      expect(hasValidLicense()).toBe(true);
    });
  });

  describe('checksum security', () => {
    it('should reject key with tampered payload', () => {
      const key = generateLicenseKey();
      // Tamper with one character in the payload
      const parts = key.split('-');
      parts[1] = parts[1].replace(parts[1][0], parts[1][0] === 'A' ? 'B' : 'A');
      const tamperedKey = parts.join('-');
      expect(isValidLicenseFormat(tamperedKey)).toBe(false);
    });

    it('should reject key with tampered checksum', () => {
      const key = generateLicenseKey();
      // Tamper with checksum
      const parts = key.split('-');
      parts[3] = 'ZZZZ';
      const tamperedKey = parts.join('-');
      expect(isValidLicenseFormat(tamperedKey)).toBe(false);
    });

    it('should reject swapped payload parts', () => {
      const key = generateLicenseKey();
      const parts = key.split('-');
      // Swap parts[1] and parts[2]
      const swappedKey = `${parts[0]}-${parts[2]}-${parts[1]}-${parts[3]}`;
      expect(isValidLicenseFormat(swappedKey)).toBe(false);
    });
  });
});
