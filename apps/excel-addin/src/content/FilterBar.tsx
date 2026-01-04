/**
 * FilterBar Component for Content Add-in
 *
 * Displays active slicer filters as a breadcrumb trail with a Clear All button.
 * Uses dark theme styling to match the Content Add-in dashboard.
 * Read-only navigation (slicers control filtering, not clicks).
 */

import React from 'react';
import { darkTheme } from '../lib/darkTheme';

export interface ActiveFilter {
  column: string;
  values: string[];
}

interface FilterBarProps {
  filters: ActiveFilter[];
  onClearAll: () => void;
  onClearFilter?: (column: string) => void;
}

/** Home icon SVG */
const HomeIcon: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

/** Chevron separator */
const ChevronRight: React.FC<{ size?: number }> = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/**
 * Displays active slicer filters as a breadcrumb trail
 */
const FilterBar: React.FC<FilterBarProps> = ({ filters, onClearAll, onClearFilter }) => {
  // Don't render if no filters active
  if (filters.length === 0) {
    return null;
  }

  return (
    <nav style={styles.container} aria-label="Filter breadcrumb">
      <div style={styles.breadcrumbList}>
        {/* Root/Home item */}
        <span style={styles.rootItem}>
          <HomeIcon size={12} />
          <span style={{ marginLeft: 4 }}>All Data</span>
        </span>

        {/* Filter items with chevron separators */}
        {filters.map(filter => (
          <React.Fragment key={filter.column}>
            <span style={styles.chevron}>
              <ChevronRight size={12} />
            </span>
            <span style={styles.filterItem}>
              <span style={styles.filterColumn}>{filter.column}:</span>
              <span style={styles.filterValues}>
                {filter.values.slice(0, 2).join(', ')}
                {filter.values.length > 2 && ` +${filter.values.length - 2}`}
              </span>
              {onClearFilter && (
                <button
                  onClick={() => onClearFilter(filter.column)}
                  style={styles.itemClose}
                  title={`Clear ${filter.column} filter`}
                  aria-label={`Clear ${filter.column} filter`}
                >
                  ×
                </button>
              )}
            </span>
          </React.Fragment>
        ))}
      </div>
      <button onClick={onClearAll} style={styles.clearButton} title="Clear all slicer selections">
        Clear All
      </button>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: darkTheme.spacingM,
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingM}px`,
    backgroundColor: darkTheme.colorNeutralBackground2,
    borderRadius: darkTheme.borderRadiusM,
    marginBottom: darkTheme.spacingM,
    minHeight: 36,
  },
  breadcrumbList: {
    display: 'flex',
    alignItems: 'center',
    gap: darkTheme.spacingXS,
    flexWrap: 'wrap',
    flex: 1,
  },
  rootItem: {
    display: 'flex',
    alignItems: 'center',
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingS}px`,
    borderRadius: darkTheme.borderRadiusS,
    fontSize: darkTheme.fontSizeSmall,
    color: darkTheme.colorNeutralForeground2,
  },
  chevron: {
    display: 'flex',
    alignItems: 'center',
    color: darkTheme.colorNeutralForeground3,
  },
  filterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: darkTheme.spacingXS,
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingS}px`,
    backgroundColor: darkTheme.colorNeutralBackground3,
    borderRadius: darkTheme.borderRadiusS,
    fontSize: darkTheme.fontSizeSmall,
    color: darkTheme.colorNeutralForeground1,
  },
  filterColumn: {
    color: darkTheme.colorNeutralForeground2,
  },
  filterValues: {
    color: darkTheme.colorNeutralForeground1,
    fontWeight: darkTheme.fontWeightSemibold,
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemClose: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
    padding: 0,
    marginLeft: darkTheme.spacingXS,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: darkTheme.borderRadiusCircular,
    color: darkTheme.colorNeutralForeground3,
    cursor: 'pointer',
    fontSize: 12,
    lineHeight: 1,
  },
  clearButton: {
    padding: `${darkTheme.spacingXS}px ${darkTheme.spacingM}px`,
    backgroundColor: 'transparent',
    border: `1px solid ${darkTheme.colorNeutralStroke1}`,
    borderRadius: darkTheme.borderRadiusS,
    color: darkTheme.colorNeutralForeground1,
    fontSize: darkTheme.fontSizeSmall,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.15s, border-color 0.15s',
  },
};

export default FilterBar;
