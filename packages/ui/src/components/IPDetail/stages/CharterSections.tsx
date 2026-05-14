import React from 'react';
import { ImprovementProjectForm } from '../../ImprovementProject/ImprovementProjectForm';
import type { ImprovementProjectFormProps } from '../../ImprovementProject/ImprovementProjectForm';

/**
 * Charter stage Sections renders the existing 6-section ImprovementProjectForm.
 * The form already supports per-section props; the IPDetailPage caller controls
 * which props are passed (typically expanding metadata + background + goal +
 * investigationLineage for the Charter stage; later PRs add stage-aware expansion).
 */
const CharterSections: React.FC<ImprovementProjectFormProps> = props => (
  <ImprovementProjectForm {...props} />
);

export default CharterSections;
