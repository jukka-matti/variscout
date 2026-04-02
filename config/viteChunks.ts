/**
 * Shared manualChunks config for VariScout apps.
 * Keeps chunk splitting consistent across PWA and Azure.
 */
export function variscoutManualChunks(id: string): string | undefined {
  // Locale files → individual named chunks (English stays in main bundle)
  const localeMatch = id.match(/i18n\/messages\/(\w+)\.ts$/);
  if (localeMatch && localeMatch[1] !== 'en') {
    return `locale-${localeMatch[1]}`;
  }
  if (id.includes('node_modules/d3-')) return 'vendor-d3';
  if (id.includes('node_modules/@visx/')) return 'vendor-visx';
  if (
    id.includes('node_modules/react/') ||
    id.includes('node_modules/react-dom/') ||
    id.includes('node_modules/scheduler/')
  ) {
    return 'vendor-react';
  }
  if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
  if (id.includes('node_modules/dexie')) return 'vendor-storage';
  return undefined;
}
