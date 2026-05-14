/**
 * Minimal ImportMeta augmentation for packages that use import.meta.env / import.meta.glob
 * but do not have `vite` as a direct dependency (and therefore cannot use
 * `/// <reference types="vite/client" />`).
 *
 * Covers the call-sites in this package:
 *   - import.meta.env.DEV  (usePopoutChannel.ts)
 *   - import.meta.glob(...)  (__tests__/useLocaleState.test.ts, __tests__/useTranslation.test.ts)
 */

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  // Eager mode — returns the module directly
  glob<T = unknown>(
    pattern: string | string[],
    options: { eager: true; as?: string }
  ): Record<string, T>;
  // Lazy mode (default) — returns a dynamic import factory
  glob<T = unknown>(
    pattern: string | string[],
    options?: { eager?: false; as?: string }
  ): Record<string, () => Promise<T>>;
}
