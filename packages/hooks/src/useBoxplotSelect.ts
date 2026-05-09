import { useState } from 'react';
import type React from 'react';

export interface UseBoxplotSelectArgs {
  onCommit?: (category: string) => void;
}

export interface UseBoxplotSelectReturn {
  /**
   * Returns the handler set to spread onto each <g data-testid="mini-boxplot-box-XYZ">
   * or <g data-testid="mini-boxplot-dots-XYZ"> wrapper for category XYZ.
   */
  getCategoryHandlers: (category: string) => {
    onPointerUp: (e: React.PointerEvent<SVGElement>) => void;
    style: { cursor: string };
  };
  selectedCategory: string | null;
}

export function useBoxplotSelect(args: UseBoxplotSelectArgs): UseBoxplotSelectReturn {
  const { onCommit } = args;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryHandlers = (category: string) => ({
    onPointerUp(_e: React.PointerEvent<SVGElement>) {
      setSelectedCategory(category);
      onCommit?.(category);
    },
    style: { cursor: 'pointer' as const },
  });

  return { getCategoryHandlers, selectedCategory };
}
