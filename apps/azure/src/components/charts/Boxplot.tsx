/**
 * Azure Boxplot - Thin wrapper around shared @variscout/charts BoxplotBase
 *
 * This wrapper:
 * 1. Gets data from DataContext via useData()
 * 2. Computes BoxplotGroupData[] from filtered data
 * 3. Manages Azure-specific UI (axis label editing)
 * 4. Passes everything to shared BoxplotBase
 */
import React, { useState } from 'react';
import { withParentSize } from '@visx/responsive';
import { useData } from '../../context/DataContext';
import { useChartScale } from '../../hooks/useChartScale';
import { BoxplotBase } from '@variscout/charts';
import { useBoxplotData } from '@variscout/hooks';
import AxisEditor from '../AxisEditor';

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
  const data = useBoxplotData(filteredData, factor, outcome);

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
  const selectedGroups = (filters[factor] || []).map(String);

  return (
    <div className="relative w-full h-full">
      <BoxplotBase
        data={data}
        specs={specs}
        showViolin={displayOptions.showViolin}
        showContributionLabels={displayOptions.showContributionLabels}
        categoryContributions={categoryContributions}
        yAxisLabel={columnAliases[outcome] || outcome}
        xAxisLabel={alias}
        yDomainOverride={{ min, max }}
        selectedGroups={selectedGroups}
        onBoxClick={handleBoxClick}
        sampleSize={filteredData.length}
        variationPct={variationPct}
        parentWidth={parentWidth}
        parentHeight={parentHeight}
        showBranding={false}
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
