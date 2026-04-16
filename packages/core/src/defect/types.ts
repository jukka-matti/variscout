export type DefectDataShape = 'event-log' | 'pre-aggregated' | 'pass-fail';

export interface DefectMapping {
  dataShape: DefectDataShape;
  defectTypeColumn?: string;
  countColumn?: string;
  resultColumn?: string;
  aggregationUnit: string;
  unitsProducedColumn?: string;
  costColumn?: string;
  durationColumn?: string;
}

export interface DefectDetection {
  isDefectFormat: boolean;
  confidence: 'high' | 'medium' | 'low';
  dataShape: DefectDataShape;
  suggestedMapping: Partial<DefectMapping>;
}
