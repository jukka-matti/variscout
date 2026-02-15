/**
 * PWA Boxplot - Thin wrapper around shared @variscout/charts BoxplotBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Computes BoxplotGroupData[] from filtered data
 * 3. Applies displayOptions toggles (showSpecs, showContributionLabels)
 * 4. Manages PWA-specific UI (axis label editing with value labels)
 * 5. Passes everything to shared BoxplotBase
 */
import React, { useMemo, useState } from 'react';
import { withParentSize } from '@visx/responsive';
import * as d3 from 'd3';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotBase, type BoxplotGroupData } from '@variscout/charts';
import { AxisEditor } from '@variscout/ui';
import { shouldShowBranding, getBrandingText } from '../../lib/edition';

interface BoxplotProps {
  factor: string;
  parentWidth: number;
  parentHeight: number;
  onDrillDown?: (factor: string, value: string) => void;
  variationPct?: number;
  categoryContributions?: Map<string | number, number>;
}

const Boxplot = ({
  factor,
  parentWidth,
  parentHeight,
  onDrillDown,
  variationPct,
  categoryContributions,
}: BoxplotProps) => {
  const {
    filteredData,
    outcome,
    filters,
    setFilters,
    columnAliases,
    setColumnAliases,
    valueLabels,
    setValueLabels,
    specs,
    displayOptions,
  } = useData();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const { min, max } = useChartScale();

  // Compute boxplot data from filtered data
  const data = useMemo<BoxplotGroupData[]>(() => {
    if (!outcome) return [];
    const groups = d3.group(filteredData, (d: any) => d[factor]);
    return Array.from(groups, ([key, groupValues]) => {
      const v = groupValues
        .map((d: any) => Number(d[outcome]))
        .filter(val => !isNaN(val))
        .sort(d3.ascending);
      if (v.length === 0) return null;
      const q1 = d3.quantile(v, 0.25) || 0;
      const median = d3.quantile(v, 0.5) || 0;
      const q3 = d3.quantile(v, 0.75) || 0;
      const iqr = q3 - q1;
      const whiskerMin = Math.max(v[0], q1 - 1.5 * iqr);
      const whiskerMax = Math.min(v[v.length - 1], q3 + 1.5 * iqr);
      const mean = d3.mean(v) || 0;
      return {
        key: String(key),
        q1,
        median,
        q3,
        min: whiskerMin,
        max: whiskerMax,
        mean,
        outliers: v.filter(x => x < whiskerMin || x > whiskerMax),
        values: v,
      };
    }).filter((d): d is BoxplotGroupData => d !== null);
  }, [filteredData, factor, outcome]);

  const handleBoxClick = (key: string) => {
    if (onDrillDown) {
      onDrillDown(factor, key);
    } else {
      const currentFilters = filters[factor] || [];
      const newFilters = currentFilters.includes(key)
        ? currentFilters.filter(v => v !== key)
        : [...currentFilters, key];
      setFilters({ ...filters, [factor]: newFilters });
    }
  };

  const handleSaveAlias = (newAlias: string, newValueLabels?: Record<string, string>) => {
    setColumnAliases({ ...columnAliases, [factor]: newAlias });
    if (newValueLabels) {
      setValueLabels({ ...valueLabels, [factor]: newValueLabels });
    }
  };

  if (!outcome || data.length === 0) return null;

  const alias = columnAliases[factor] || factor;
  const factorLabels = valueLabels[factor] || {};
  const showBranding = shouldShowBranding();
  const selectedGroups = (filters[factor] || []).map(String);
  const effectiveSpecs = displayOptions.showSpecs !== false ? specs : {};

  return (
    <div className="relative w-full h-full">
      <BoxplotBase
        data={data}
        specs={effectiveSpecs}
        yAxisLabel={columnAliases[outcome] || outcome}
        xAxisLabel={alias}
        yDomainOverride={{ min, max }}
        selectedGroups={selectedGroups}
        onBoxClick={handleBoxClick}
        sampleSize={filteredData.length}
        variationPct={variationPct}
        categoryContributions={categoryContributions}
        showContributionLabels={displayOptions.showContributionLabels}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={showBranding}
        brandingText={showBranding ? getBrandingText() : undefined}
        onYAxisClick={() => setIsEditingLabel(true)}
        onXAxisClick={() => setIsEditingLabel(true)}
        xTickFormat={(val: string) => factorLabels[val] || val}
      />

      {isEditingLabel && (
        <AxisEditor
          title="Edit Axis & Categories"
          originalName={factor}
          alias={alias}
          values={data.map(d => d.key)}
          valueLabels={factorLabels}
          onSave={handleSaveAlias}
          onClose={() => setIsEditingLabel(false)}
          style={{ bottom: 10, left: parentWidth / 2 - 120 }}
        />
      )}
    </div>
  );
};

export default withParentSize(Boxplot);
