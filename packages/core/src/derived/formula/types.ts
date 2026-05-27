export type FormulaTerm =
  | { kind: 'column'; column: string; sign: '+' | '-' }
  | { kind: 'constant'; value: number };

export type FormulaFamily = 'batchRatio' | 'dpmo' | 'throughput' | 'difference' | 'custom';

export interface FormulaBinding {
  id: string;
  name: string;
  numerator: FormulaTerm[];
  denominator: FormulaTerm[];
  multiplier: number;
  templateId?: string;
  family?: FormulaFamily;
}
