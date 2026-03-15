export type PreviewFeature = 'knowledge-base';

const STORAGE_PREFIX = 'variscout-preview-';

export function isPreviewEnabled(feature: PreviewFeature): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${feature}`) === 'true';
  } catch {
    return false;
  }
}

export function setPreviewEnabled(feature: PreviewFeature, enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(`${STORAGE_PREFIX}${feature}`, 'true');
    } else {
      localStorage.removeItem(`${STORAGE_PREFIX}${feature}`);
    }
  } catch {
    // Quota exceeded or unavailable — silently ignore
  }
}
