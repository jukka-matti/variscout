import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Coffee,
  Factory,
  FlaskConical,
  Search,
  FolderOpen,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { SAMPLES, type SampleDataset, type SampleCategory } from '@variscout/data';
import { useTranslation } from '@variscout/hooks';
import type { MessageCatalog } from '@variscout/core';

interface SampleSectionProps {
  onLoadSample: (sample: SampleDataset) => void;
  variant: 'web' | 'installed';
}

// Category display configuration (order only; labels resolved via i18n inside component)
const CATEGORY_ORDER: Record<SampleCategory, number> = {
  featured: 0,
  cases: 1,
  journeys: 2,
  standard: 3,
};

// i18n key mapping for category labels
const CATEGORY_LABEL_KEYS: Record<SampleCategory, keyof MessageCatalog> = {
  featured: 'sample.featured',
  cases: 'sample.caseStudies',
  journeys: 'sample.journeys',
  standard: 'sample.industry',
};

const CURATED_DEMO_KEYS = ['syringe-barrel-weight', 'bottleneck'] as const;

const CURATED_DEMO_COPY: Record<
  (typeof CURATED_DEMO_KEYS)[number],
  { label: string; summary: string; badges: string[] }
> = {
  'syringe-barrel-weight': {
    label: 'End-to-end GB case',
    summary: 'Capability gap, seeded findings, comments, suspected cause, Pareto, and actions.',
    badges: ['Analyze', 'Capability', 'Improve'],
  },
  bottleneck: {
    label: 'Process-flow case',
    summary: 'Step timing, process map, bottleneck evidence, comments, and response actions.',
    badges: ['Process', 'Explore', 'Improve'],
  },
};

// Icon mapping for featured cards
const FEATURED_ICONS: Record<string, React.ReactNode> = {
  coffee: <Coffee size={24} className="text-amber-400" />,
  factory: <Factory size={24} className="text-blue-400" />,
  search: <Search size={24} className="text-purple-400" />,
  'flask-conical': <FlaskConical size={24} className="text-emerald-400" />,
};

/**
 * Sample data section with featured cards and collapsible categories
 *
 * - Web variant: Shows featured samples as large cards, others in collapsible list
 * - Installed variant: Compact collapsible list only
 */
const SampleSection: React.FC<SampleSectionProps> = ({ onLoadSample, variant }) => {
  const { t } = useTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Set<SampleCategory>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  const curatedSamples = CURATED_DEMO_KEYS.map(key => SAMPLES.find(s => s.urlKey === key)).filter(
    (sample): sample is SampleDataset => Boolean(sample)
  );
  const featuredSamples = SAMPLES.filter(
    s => s.featured && !CURATED_DEMO_KEYS.includes(s.urlKey as (typeof CURATED_DEMO_KEYS)[number])
  );
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
    .sort((a, b) => CATEGORY_ORDER[a] - CATEGORY_ORDER[b]);

  // Web variant: Featured cards + collapsible categories
  if (variant === 'web') {
    return (
      <div className="space-y-6">
        {/* Curated demo cases */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wider">
              Guided demo cases
            </h3>
            <span className="text-xs text-content-muted">Best first</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {curatedSamples.map(sample => {
              const copy = CURATED_DEMO_COPY[sample.urlKey as (typeof CURATED_DEMO_KEYS)[number]];
              return (
                <button
                  key={sample.urlKey}
                  data-testid={`sample-curated-${sample.urlKey}`}
                  onClick={() => onLoadSample(sample)}
                  className="w-full flex items-start gap-4 p-4 bg-surface hover:bg-surface-tertiary border border-edge hover:border-blue-500/50 rounded-xl text-left transition-all group"
                >
                  <div className="p-2 bg-surface-secondary rounded-lg border border-edge">
                    {sample.urlKey === 'bottleneck' ? (
                      <GitBranch size={24} className="text-blue-400" />
                    ) : (
                      FEATURED_ICONS[sample.icon] || (
                        <FolderOpen size={24} className="text-content-secondary" />
                      )
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-content group-hover:text-blue-400 transition-colors">
                        {sample.name.replace('Case: ', '')}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {copy.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-content-secondary">{copy.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {copy.badges.map(badge => (
                        <span
                          key={badge}
                          className="text-[11px] px-2 py-0.5 rounded bg-surface-secondary text-content-muted border border-edge"
                        >
                          {badge}
                        </span>
                      ))}
                      <span className="text-[11px] text-content-muted">
                        {sample.data.length} rows
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="mt-1 text-content-muted group-hover:text-blue-400 transition-colors"
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured sample cards */}
        <div>
          <h3 className="text-sm font-semibold text-content-secondary mb-3 uppercase tracking-wider">
            More featured samples
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {featuredSamples.map(sample => (
              <button
                key={sample.urlKey}
                data-testid={`sample-featured-${sample.urlKey}`}
                onClick={() => onLoadSample(sample)}
                className="flex flex-col items-start p-4 bg-surface-secondary hover:bg-surface-tertiary border border-edge hover:border-blue-500/50 rounded-xl text-left transition-all group"
              >
                <div className="p-2 bg-surface rounded-lg mb-3">
                  {FEATURED_ICONS[sample.icon] || (
                    <FolderOpen size={24} className="text-content-secondary" />
                  )}
                </div>
                <div className="text-sm font-medium text-content group-hover:text-blue-400 transition-colors">
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
            {t('sample.allSamples')}
          </div>
          <div className="space-y-1">
            {sortedCategories.map(category => {
              const samples = categorizedSamples[category];
              const isExpanded = expandedCategories.has(category);
              const categoryLabel = t(CATEGORY_LABEL_KEYS[category]);

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
                      <span className="text-sm text-content-secondary group-hover:text-content">
                        {categoryLabel}
                      </span>
                    </div>
                    <span className="text-xs text-content-muted">{samples.length}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {samples.map(sample => (
                        <button
                          key={sample.urlKey}
                          data-testid={`sample-${sample.urlKey}`}
                          onClick={() => onLoadSample(sample)}
                          className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-content-secondary group-hover:text-content truncate">
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
    (a, b) => CATEGORY_ORDER[a] - CATEGORY_ORDER[b]
  );

  const totalSamples = SAMPLES.length;

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
          <span className="text-sm text-content-secondary group-hover:text-content">
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
            const catLabel = t(CATEGORY_LABEL_KEYS[category]);

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
                      {catLabel}
                    </span>
                  </div>
                  <span className="text-xs text-content-muted">{samples.length}</span>
                </button>

                {isCatExpanded && (
                  <div className="ml-5 mt-1 space-y-1">
                    {samples.map(sample => (
                      <button
                        key={sample.urlKey}
                        data-testid={`sample-${sample.urlKey}`}
                        onClick={() => onLoadSample(sample)}
                        className="w-full flex items-center justify-between p-2 hover:bg-surface-secondary rounded-lg transition-colors group text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-content-secondary group-hover:text-content truncate">
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
