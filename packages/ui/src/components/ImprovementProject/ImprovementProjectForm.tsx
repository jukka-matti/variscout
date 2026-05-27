import React from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { ProgressIndicator } from './ProgressIndicator';
import {
  HeaderMetadataSection,
  type HeaderMetadataSectionProps,
} from './sections/HeaderMetadataSection';
import { BackgroundSection, type BackgroundSectionProps } from './sections/BackgroundSection';
import { GoalSection, type GoalSectionProps } from './sections/GoalSection';
import {
  AnalyzeLineageSection,
  type AnalyzeLineageSectionProps,
} from './sections/AnalyzeLineageSection';
import { ApproachSection, type ApproachSectionProps } from './sections/ApproachSection';
import {
  OutcomeReferenceSection,
  type OutcomeReferenceSectionProps,
} from './sections/OutcomeReferenceSection';

export type ImprovementProjectSectionKey =
  | 'metadata'
  | 'background'
  | 'goal'
  | 'lineage'
  | 'approach'
  | 'outcome';

type SectionContent = React.ReactNode | (() => React.ReactNode);

interface ImprovementProjectSection {
  key: ImprovementProjectSectionKey;
  title: string;
  defaultOpen: boolean;
}

const SECTIONS: ImprovementProjectSection[] = [
  { key: 'metadata', title: 'Project metadata', defaultOpen: true },
  { key: 'background', title: 'Background / Current State', defaultOpen: true },
  { key: 'goal', title: 'Goal', defaultOpen: false },
  { key: 'lineage', title: 'Investigation lineage', defaultOpen: false },
  { key: 'approach', title: 'Approach / Countermeasures', defaultOpen: false },
  { key: 'outcome', title: 'Outcome reference', defaultOpen: false },
];

const DEFAULT_CONTENT: Record<ImprovementProjectSectionKey, React.ReactNode> = {
  metadata: <p className="text-content/60">Project metadata placeholder</p>,
  background: <p className="text-content/60">Background / Current State placeholder</p>,
  goal: <p className="text-content/60">Goal placeholder</p>,
  lineage: <p className="text-content/60">Investigation lineage placeholder</p>,
  approach: <p className="text-content/60">Approach / Countermeasures placeholder</p>,
  outcome: <p className="text-content/60">Outcome reference placeholder</p>,
};

export interface ImprovementProjectFormProps {
  currentStep?: number;
  metadataProps?: HeaderMetadataSectionProps;
  backgroundProps?: BackgroundSectionProps;
  goalProps?: GoalSectionProps;
  lineageProps?: AnalyzeLineageSectionProps;
  approachProps?: ApproachSectionProps;
  outcomeReferenceProps?: OutcomeReferenceSectionProps;
  sectionContent?: Partial<Record<ImprovementProjectSectionKey, SectionContent>>;
}

function renderSectionContent(
  content: SectionContent | undefined,
  key: ImprovementProjectSectionKey,
  metadataProps?: HeaderMetadataSectionProps,
  backgroundProps?: BackgroundSectionProps,
  goalProps?: GoalSectionProps,
  lineageProps?: AnalyzeLineageSectionProps,
  approachProps?: ApproachSectionProps,
  outcomeReferenceProps?: OutcomeReferenceSectionProps
) {
  if (typeof content === 'function') {
    return content();
  }

  if (content === undefined && key === 'metadata' && metadataProps) {
    return <HeaderMetadataSection {...metadataProps} />;
  }

  if (content === undefined && key === 'background' && backgroundProps) {
    return <BackgroundSection {...backgroundProps} />;
  }

  if (content === undefined && key === 'goal' && goalProps) {
    return <GoalSection {...goalProps} />;
  }

  if (content === undefined && key === 'lineage' && lineageProps) {
    return <AnalyzeLineageSection {...lineageProps} />;
  }

  if (content === undefined && key === 'approach' && approachProps) {
    return <ApproachSection {...approachProps} />;
  }

  if (content === undefined && key === 'outcome' && outcomeReferenceProps) {
    return <OutcomeReferenceSection {...outcomeReferenceProps} />;
  }

  return content ?? DEFAULT_CONTENT[key];
}

export const ImprovementProjectForm: React.FC<ImprovementProjectFormProps> = ({
  currentStep = 1,
  metadataProps,
  backgroundProps,
  goalProps,
  lineageProps,
  approachProps,
  outcomeReferenceProps,
  sectionContent,
}) => {
  return (
    <div className="space-y-4">
      <ProgressIndicator currentStep={currentStep} />

      <div className="space-y-3">
        {SECTIONS.map(section => (
          <CollapsibleSection
            key={section.key}
            title={section.title}
            defaultOpen={section.defaultOpen}
          >
            {renderSectionContent(
              sectionContent?.[section.key],
              section.key,
              metadataProps,
              backgroundProps,
              goalProps,
              lineageProps,
              approachProps,
              outcomeReferenceProps
            )}
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
};
