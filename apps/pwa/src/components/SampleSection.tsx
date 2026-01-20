import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Coffee,
  Factory,
  Search,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';
import { SAMPLES, SampleDataset, SampleCategory } from '../data/sampleData';

interface SampleSectionProps {
  onLoadSample: (sample: SampleDataset) => void;
  variant: 'web' | 'installed';
}

// Category display configuration
const CATEGORY_CONFIG: Record<SampleCategory, { label: string; order: number }> = {
  featured: { label: 'Featured', order: 0 },
  cases: { label: 'Case Studies', order: 1 },
  journeys: { label: 'Learning Journeys', order: 2 },
  standard: { label: 'Industry Examples', order: 3 },
};

// Icon mapping for featured cards
const FEATURED_ICONS: Record<string, React.ReactNode> = {
  coffee: <Coffee size={24} className="text-amber-400" />,
  factory: <Factory size={24} className="text-blue-400" />,
  search: <Search size={24} className="text-purple-400" />,
};

/**
 * Sample data section with featured cards and collapsible categories
 *
 * - Web variant: Shows featured samples as large cards, others in collapsible list
 * - Installed variant: Compact collapsible list only
 */
const SampleSection: React.FC<SampleSectionProps> = ({ onLoadSample, variant }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<SampleCategory>>(new Set());

  const featuredSamples = SAMPLES.filter(s => s.featured);
  const categorizedSamples = SAMPLES.reduce(
    (acc, sample) => {
      if (!acc[sample.category]) {
        acc[sample.category] = [];
      }
      acc[sample.category].push(sample);
      return acc;
    },
    {} as Record<SampleCategory, SampleDataset[]>
  );

  const toggleCategory = (category: SampleCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Sort categories by order
  const sortedCategories = (Object.keys(categorizedSamples) as SampleCategory[])
    .filter(cat => cat !== 'featured') // Featured is shown separately in web mode
    .sort((a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order);

  // Web variant: Featured cards + collapsible categories
  if (variant === 'web') {
    return (
      <div className="space-y-6">
        {/* Featured sample cards */}
        <div>
          <h3 className="text-sm font-semibold text-content-secondary mb-3 uppercase tracking-wider">
            Try a Sample Dataset
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featuredSamples.map(sample => (
              <button
                key={sample.urlKey}
                onClick={() => onLoadSample(sample)}
                className="flex flex-col items-start p-4 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500/50 rounded-xl text-left transition-all group"
              >
                <div className="p-2 bg-surface rounded-lg mb-3">
                  {FEATURED_ICONS[sample.icon] || (
                    <FolderOpen size={24} className="text-content-secondary" />
                  )}
                </div>
                <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                  {sample.name.replace('Case: ', '').replace('Journey: ', '')}
                </div>
                <div className="text-xs text-content-muted mt-1">{sample.data.length} rows</div>
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible category lists */}
        <div className="border-t border-edge pt-4">
          <div className="text-xs text-content-muted mb-3 uppercase tracking-wider">
            All Sample Datasets
          </div>
          <div className="space-y-1">
            {sortedCategories.map(category => {
              const samples = categorizedSamples[category];
              const isExpanded = expandedCategories.has(category);
              const config = CATEGORY_CONFIG[category];

              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-content-muted" />
                      ) : (
                        <ChevronRight size={16} className="text-content-muted" />
                      )}
                      <span className="text-sm text-content-secondary group-hover:text-white">
                        {config.label}
                      </span>
                    </div>
                    <span className="text-xs text-content-muted">{samples.length}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {samples.map(sample => (
                        <button
                          key={sample.urlKey}
                          onClick={() => onLoadSample(sample)}
                          className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-content-secondary group-hover:text-white truncate">
                              {sample.name}
                            </div>
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-content-muted group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all ml-2 flex-shrink-0"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Installed variant: Compact collapsible list
  const allCategories = (Object.keys(categorizedSamples) as SampleCategory[]).sort(
    (a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order
  );

  const totalSamples = SAMPLES.length;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-edge pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown size={16} className="text-content-muted" />
          ) : (
            <ChevronRight size={16} className="text-content-muted" />
          )}
          <span className="text-sm text-content-secondary group-hover:text-white">
            Sample datasets
          </span>
        </div>
        <span className="text-xs text-content-muted">{totalSamples}</span>
      </button>

      {isExpanded && (
        <div className="ml-4 mt-2 space-y-2">
          {allCategories.map(category => {
            const samples = categorizedSamples[category];
            const isCatExpanded = expandedCategories.has(category);
            const config = CATEGORY_CONFIG[category];

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    {isCatExpanded ? (
                      <ChevronDown size={14} className="text-content-muted" />
                    ) : (
                      <ChevronRight size={14} className="text-content-muted" />
                    )}
                    <span className="text-xs text-content-muted group-hover:text-content-secondary">
                      {config.label}
                    </span>
                  </div>
                  <span className="text-xs text-content-muted">{samples.length}</span>
                </button>

                {isCatExpanded && (
                  <div className="ml-5 mt-1 space-y-1">
                    {samples.map(sample => (
                      <button
                        key={sample.urlKey}
                        onClick={() => onLoadSample(sample)}
                        className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-content-secondary group-hover:text-white truncate">
                            {sample.name}
                          </div>
                        </div>
                        <ArrowRight
                          size={12}
                          className="text-content-muted group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all ml-2 flex-shrink-0"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SampleSection;
