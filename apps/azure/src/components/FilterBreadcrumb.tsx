/**
 * Re-export FilterBreadcrumb from @variscout/ui
 *
 * This component has been moved to the shared UI package.
 * Uses default semantic-token-based color scheme.
 */
import {
  FilterBreadcrumb as FilterBreadcrumbBase,
  type FilterBreadcrumbProps as BaseProps,
} from '@variscout/ui';

export interface FilterBreadcrumbProps {
  filterChipData: BaseProps['filterChipData'];
  columnAliases?: BaseProps['columnAliases'];
  onUpdateFilterValues: BaseProps['onUpdateFilterValues'];
  onRemoveFilter: BaseProps['onRemoveFilter'];
  onClearAll?: BaseProps['onClearAll'];
  cumulativeVariationPct?: BaseProps['cumulativeVariationPct'];
}

const FilterBreadcrumb = ({
  filterChipData,
  columnAliases,
  onUpdateFilterValues,
  onRemoveFilter,
  onClearAll,
  cumulativeVariationPct,
}: FilterBreadcrumbProps) => {
  return (
    <FilterBreadcrumbBase
      filterChipData={filterChipData}
      columnAliases={columnAliases}
      onUpdateFilterValues={onUpdateFilterValues}
      onRemoveFilter={onRemoveFilter}
      onClearAll={onClearAll}
      cumulativeVariationPct={cumulativeVariationPct}
    />
  );
};

export default FilterBreadcrumb;
