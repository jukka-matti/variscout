import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { WhatIfPageBase } from '@variscout/ui';
import type { FilterAction, FindingProjection } from '@variscout/core';

interface WhatIfPageProps {
  onBack: () => void;
  filterCount?: number;
  filterStack?: FilterAction[];
  /** Context for idea→What-If round-trip */
  projectionContext?: { ideaText: string; questionText: string };
  /** Save projection back to idea */
  onSaveProjection?: (projection: FindingProjection) => void;
}

const WhatIfPage: React.FC<WhatIfPageProps> = ({
  onBack,
  filterCount = 0,
  filterStack,
  projectionContext,
  onSaveProjection,
}) => {
  const { filteredData, rawData, outcome, specs, columnAliases, cpkTarget, viewState } = useData();

  const filterNames = useMemo(() => {
    if (!filterStack || filterStack.length === 0) return undefined;
    return filterStack
      .filter(f => f.factor)
      .map(f => {
        const alias = (f.factor && columnAliases[f.factor]) || f.factor || '';
        return `${alias} = ${f.values.join(', ')}`;
      });
  }, [filterStack, columnAliases]);

  return (
    <WhatIfPageBase
      filteredData={filteredData}
      rawData={rawData}
      outcome={outcome}
      specs={specs}
      filterCount={filterCount}
      filterNames={filterNames}
      onBack={onBack}
      cpkTarget={cpkTarget}
      activeFactor={viewState?.boxplotFactor}
      projectionContext={projectionContext}
      onSaveProjection={onSaveProjection}
    />
  );
};

export default WhatIfPage;
