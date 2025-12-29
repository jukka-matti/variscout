/**
 * License key validation for VariScout Lite Pro
 *
 * License format: VSL-XXXX-XXXX-XXXX (where X is alphanumeric)
 * The last 4 characters are a simple checksum for offline validation
 */

const LICENSE_KEY = 'variscout_license';

/**
 * Validate license key format and checksum
 * Format: VSL-XXXX-XXXX-XXXX
 */
export function isValidLicenseFormat(key: string): boolean {
  // Check format: VSL-XXXX-XXXX-XXXX
  const pattern = /^VSL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(key.toUpperCase())) {
    return false;
  }

  // Simple checksum validation
  // The last 4 chars should be derived from first 8 chars
  const parts = key.toUpperCase().split('-');
  const payload = parts[1] + parts[2]; // First 8 chars after VSL-
  const checksum = parts[3]; // Last 4 chars

  const calculatedChecksum = calculateChecksum(payload);
  return checksum === calculatedChecksum;
}

/**
 * Calculate a simple 4-character checksum from payload
 */
function calculateChecksum(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to base36 and take last 4 chars, pad if needed
  const base36 = Math.abs(hash).toString(36).toUpperCase();
  return base36.slice(-4).padStart(4, '0');
}

/**
 * Generate a valid license key (for testing/admin purposes)
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let payload = '';
  for (let i = 0; i < 8; i++) {
    payload += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const part1 = payload.slice(0, 4);
  const part2 = payload.slice(4, 8);
  const checksum = calculateChecksum(payload);

  return `VSL-${part1}-${part2}-${checksum}`;
}

/**
 * Store license key in localStorage
 */
export function storeLicenseKey(key: string): boolean {
  if (!isValidLicenseFormat(key)) {
    return false;
  }

  try {
    localStorage.setItem(LICENSE_KEY, key.toUpperCase());
    return true;
  } catch (e) {
    console.warn('Failed to store license key:', e);
    return false;
  }
}

/**
 * Get stored license key
 */
export function getStoredLicenseKey(): string | null {
  try {
    return localStorage.getItem(LICENSE_KEY);
  } catch (e) {
    return null;
  }
}

/**
 * Remove stored license key
 */
export function removeLicenseKey(): void {
  try {
    localStorage.removeItem(LICENSE_KEY);
  } catch (e) {
    console.warn('Failed to remove license key:', e);
  }
}

/**
 * Check if a valid license is currently stored
 */
export function hasValidLicense(): boolean {
  const key = getStoredLicenseKey();
  if (!key) return false;
  return isValidLicenseFormat(key);
}
