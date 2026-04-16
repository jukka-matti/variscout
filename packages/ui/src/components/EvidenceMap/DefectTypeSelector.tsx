import React from 'react';

export interface DefectTypeSelectorProps {
  selectedView: string; // 'all' | type name | 'cross-type'
  onViewChange: (view: string) => void;
  defectTypes: string[]; // ordered by frequency (most first)
  analyzedTypes: string[]; // types already computed/cached
  totalTypeCount: number;
  analyzedTypeCount: number;
}

const pillBase =
  'inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border whitespace-nowrap transition-colors cursor-pointer';

const pillInactive = 'bg-surface-secondary border-edge text-content hover:bg-surface-tertiary';

const pillActiveBlue = 'bg-blue-500 border-blue-500 text-white';
const pillActiveGreen = 'bg-green-600 border-green-600 text-white';
const pillInactiveGreen = 'bg-surface-secondary border-green-600 text-green-600';

export const DefectTypeSelector: React.FC<DefectTypeSelectorProps> = ({
  selectedView,
  onViewChange,
  defectTypes,
  analyzedTypes,
  totalTypeCount,
  analyzedTypeCount,
}) => {
  const analyzedSet = new Set(analyzedTypes);

  return (
    <div
      className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-hide"
      data-testid="defect-type-selector"
      role="tablist"
      aria-label="Defect type view"
    >
      {/* All Defects — always first */}
      <button
        role="tab"
        aria-selected={selectedView === 'all'}
        className={`${pillBase} ${selectedView === 'all' ? pillActiveBlue : pillInactive}`}
        onClick={() => onViewChange('all')}
      >
        All Defects
      </button>

      {/* Per-type pills */}
      {defectTypes.map(typeName => {
        const isActive = selectedView === typeName;
        const isAnalyzed = analyzedSet.has(typeName);

        return (
          <button
            key={typeName}
            role="tab"
            aria-selected={isActive}
            className={`${pillBase} ${isActive ? pillActiveBlue : pillInactive}`}
            onClick={() => onViewChange(typeName)}
          >
            {/* Analyzed indicator dot */}
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                isActive
                  ? 'bg-white'
                  : isAnalyzed
                    ? 'bg-blue-500'
                    : 'border border-current bg-transparent'
              }`}
              aria-hidden="true"
            />
            <span className="truncate max-w-[8rem]">{typeName}</span>
          </button>
        );
      })}

      {/* Cross-Type — always last */}
      <button
        role="tab"
        aria-selected={selectedView === 'cross-type'}
        className={`${pillBase} ${selectedView === 'cross-type' ? pillActiveGreen : pillInactiveGreen}`}
        onClick={() => onViewChange('cross-type')}
      >
        Cross-Type
        <span
          className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] leading-none font-semibold rounded-full ${
            selectedView === 'cross-type'
              ? 'bg-white/20 text-white'
              : 'bg-green-600/10 text-green-600'
          }`}
        >
          {analyzedTypeCount}/{totalTypeCount}
        </span>
      </button>
    </div>
  );
};
