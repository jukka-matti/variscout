/**
 * CategoryBadge — Dismissable pill showing an inferred investigation category on ColumnCards.
 */

import React from 'react';
import { X } from 'lucide-react';

export interface CategoryBadgeProps {
  /** Dynamic category name (e.g. "Equipment", "People", "Drying Method") */
  categoryName: string;
  /** Badge color — hex string from CATEGORY_COLORS palette */
  categoryColor?: string;
  /** The keyword that triggered inference (for tooltip) */
  matchedKeyword: string;
  onDismiss: () => void;
}

/** Convert hex color to rgba for background with opacity */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  categoryName,
  categoryColor,
  matchedKeyword,
  onDismiss,
}) => {
  // Use dynamic color from prop, or fallback to slate
  const color = categoryColor || '#64748b';

  return (
    <span
      className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[0.625rem] font-medium"
      style={{
        backgroundColor: hexToRgba(color, 0.2),
        color: color,
      }}
      data-testid="category-badge"
      title={matchedKeyword ? `Detected '${matchedKeyword}' in column name` : undefined}
    >
      {categoryName}
      <button
        onClick={e => {
          e.stopPropagation();
          onDismiss();
        }}
        className="hover:opacity-70 transition-opacity"
        aria-label={`Dismiss ${categoryName} category`}
        type="button"
      >
        <X size={10} />
      </button>
    </span>
  );
};

export default CategoryBadge;
