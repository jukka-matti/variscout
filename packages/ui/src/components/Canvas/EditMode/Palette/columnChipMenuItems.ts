import type { ParsingInterpretation } from '@variscout/core/parser';

type ColumnKind = ParsingInterpretation['kind'];

export interface ColumnMenuItem {
  id: string;
  label: string;
}

const NUMERIC: ColumnMenuItem[] = [
  { id: 'use-as-factor', label: 'Use as continuous factor' },
  { id: 'bin-into-categorical', label: 'Bin into categorical…' },
  { id: 'view-in-explore', label: 'View distribution in Explore →' },
  { id: 'calculate-from', label: 'Calculate from this column…' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const DATE: ColumnMenuItem[] = [
  { id: 'use-as-timestamp', label: 'Use as timestamp' },
  { id: 'use-as-time-factors', label: 'Use as time factors' },
  { id: 'view-in-explore', label: 'View distribution in Explore →' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const CATEGORICAL: ColumnMenuItem[] = [
  { id: 'use-as-factor', label: 'Use as factor' },
  { id: 'use-as-process-step', label: 'Use as process step' },
  { id: 'view-in-explore', label: 'View frequencies in Explore →' },
  { id: 'combine-levels', label: 'Combine levels…' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const ID: ColumnMenuItem[] = [
  { id: 'use-as-scope-id', label: 'Use as scope identifier' },
  { id: 'view-uniqueness-in-explore', label: 'View uniqueness in Explore →' },
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

const TEXT: ColumnMenuItem[] = [
  { id: 'parsing-and-format', label: 'Parsing & format' },
  { id: 'rename-column', label: 'Rename column…' },
];

export function getMenuItemsForKind(kind: ColumnKind): ColumnMenuItem[] {
  switch (kind) {
    case 'numeric':
      return NUMERIC;
    case 'date':
      return DATE;
    case 'categorical':
      return CATEGORICAL;
    case 'id':
      return ID;
    case 'text':
    default:
      return TEXT;
  }
}
