import { useMemo, useCallback } from 'react';
import {
  glossaryTerms,
  glossaryMap,
  getTerm as getTermFromCore,
  hasTerm as hasTermFromCore,
  type GlossaryTerm,
  type GlossaryCategory,
} from '@variscout/core';

export interface UseGlossaryOptions {
  /** Locale for translations (future enhancement) */
  locale?: string;
}

export interface UseGlossaryResult {
  /** Get a term by its ID */
  getTerm: (id: string) => GlossaryTerm | undefined;
  /** Get all terms in a category */
  getTermsByCategory: (category: GlossaryCategory) => GlossaryTerm[];
  /** Check if a term exists */
  hasTerm: (id: string) => boolean;
  /** All available terms */
  allTerms: GlossaryTerm[];
  /** All available categories */
  categories: GlossaryCategory[];
}

/**
 * Hook for accessing glossary terms and definitions
 *
 * @example
 * ```tsx
 * const { getTerm } = useGlossary();
 * const cpTerm = getTerm('cp');
 *
 * return <HelpTooltip term={cpTerm} />;
 * ```
 */
export function useGlossary(_options?: UseGlossaryOptions): UseGlossaryResult {
  // Memoize the getTerm function
  const getTerm = useCallback((id: string): GlossaryTerm | undefined => {
    return getTermFromCore(id);
  }, []);

  // Memoize the hasTerm function
  const hasTerm = useCallback((id: string): boolean => {
    return hasTermFromCore(id);
  }, []);

  // Memoize getTermsByCategory
  const getTermsByCategory = useCallback((category: GlossaryCategory): GlossaryTerm[] => {
    return glossaryTerms.filter(term => term.category === category);
  }, []);

  // Memoize the available categories
  const categories = useMemo((): GlossaryCategory[] => {
    const cats = new Set<GlossaryCategory>();
    glossaryTerms.forEach(term => cats.add(term.category));
    return Array.from(cats);
  }, []);

  return {
    getTerm,
    getTermsByCategory,
    hasTerm,
    allTerms: glossaryTerms,
    categories,
  };
}

export default useGlossary;
