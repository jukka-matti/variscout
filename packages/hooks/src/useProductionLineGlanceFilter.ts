import { useCallback, useEffect, useState } from 'react';
import type { SpecLookupContext } from '@variscout/core/types';

const RESERVED_PARAMS = new Set<string>(['ops']);

function readFromURL(): SpecLookupContext {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const out: SpecLookupContext = {};
  params.forEach((value, key) => {
    if (RESERVED_PARAMS.has(key)) return;
    out[key] = value;
  });
  return out;
}

function writeToURL(value: SpecLookupContext): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  const toDelete: string[] = [];
  params.forEach((_, key) => {
    if (!RESERVED_PARAMS.has(key)) toDelete.push(key);
  });
  toDelete.forEach(k => params.delete(k));
  for (const [k, v] of Object.entries(value)) {
    if (v === null || v === undefined) continue;
    params.set(k, String(v));
  }
  const next = params.toString();
  const url = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

export interface UseProductionLineGlanceFilterResult {
  value: SpecLookupContext;
  onChange: (next: SpecLookupContext) => void;
}

/**
 * URL-search-param state for the production-line-glance dashboard's filter
 * strip. Per-hub by virtue of the URL route. Reload-with-URL is the only
 * persistence path (no localStorage); reserved params (e.g. `ops=full`) are
 * preserved on write-back.
 */
export function useProductionLineGlanceFilter(): UseProductionLineGlanceFilterResult {
  const [value, setValue] = useState<SpecLookupContext>(() => readFromURL());

  useEffect(() => {
    const onPop = () => setValue(readFromURL());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const onChange = useCallback((next: SpecLookupContext) => {
    setValue(next);
    writeToURL(next);
  }, []);

  return { value, onChange };
}
