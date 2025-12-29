import React, { useState, useCallback, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Card,
  Body1,
  Body2,
  Caption1,
  Dropdown,
  Option,
  Checkbox,
  Spinner,
  ProgressBar,
  Field,
  Input,
} from '@fluentui/react-components';
import {
  TableSimple24Regular,
  Settings24Regular,
  Filter24Regular,
  ChartMultiple24Regular,
  Checkmark24Regular,
  ArrowLeft24Regular,
  ArrowRight24Regular,
} from '@fluentui/react-icons';
import { ensureTable, detectColumnTypes } from '../../lib/tableManager';
import { createSlicerRow, isSlicerSupported } from '../../lib/slicerManager';
import { saveAddInState, createInitialState, type AddInState } from '../../lib/stateBridge';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    height: '100%',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  stepIcon: {
    color: tokens.colorBrandForeground1,
  },
  stepTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  stepDescription: {
    color: tokens.colorNeutralForeground2,
    marginBottom: tokens.spacingVerticalM,
  },
  card: {
    padding: tokens.spacingVerticalM,
  },
  formGroup: {
    marginBottom: tokens.spacingVerticalM,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  progressContainer: {
    marginBottom: tokens.spacingVerticalM,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  successCard: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '48px',
    color: tokens.colorPaletteGreenForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  warning: {
    color: tokens.colorPaletteYellowForeground2,
    marginTop: tokens.spacingVerticalS,
    fontSize: tokens.fontSizeBase200,
  },
  specInputRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  specInput: {
    flex: 1,
  },
});

type WizardStep = 'data' | 'columns' | 'slicers' | 'specs' | 'complete';

interface SetupWizardProps {
  onComplete: (state: AddInState) => void;
  onCancel: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onCancel }) => {
  const styles = useStyles();
  const [currentStep, setCurrentStep] = useState<WizardStep>('data');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Data state
  const [rangeAddress, setRangeAddress] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');

  // Step 2: Column configuration
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([]);
  const [outcomeColumn, setOutcomeColumn] = useState<string>('');
  const [factorColumns, setFactorColumns] = useState<string[]>([]);

  // Step 3: Slicer configuration
  const [slicerSupported, setSlicerSupported] = useState(false);
  const [createSlicers, setCreateSlicers] = useState(true);
  const [slicerNames, setSlicerNames] = useState<string[]>([]);

  // Step 4: Spec limits
  const [usl, setUsl] = useState<string>('');
  const [lsl, setLsl] = useState<string>('');
  const [target, setTarget] = useState<string>('');

  // Check slicer support on mount
  useEffect(() => {
    setSlicerSupported(isSlicerSupported());
  }, []);

  const steps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
    { key: 'data', label: 'Select Data', icon: <TableSimple24Regular /> },
    { key: 'columns', label: 'Configure Columns', icon: <Settings24Regular /> },
    { key: 'slicers', label: 'Create Slicers', icon: <Filter24Regular /> },
    { key: 'specs', label: 'Set Specs', icon: <ChartMultiple24Regular /> },
    { key: 'complete', label: 'Complete', icon: <Checkmark24Regular /> },
  ];

  const stepIndex = steps.findIndex(s => s.key === currentStep);
  const progress = (stepIndex + 1) / steps.length;

  // Step 1: Get selected range and create table
  const handleGetSelection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await Excel.run(async context => {
        const range = context.workbook.getSelectedRange();
        range.load('address');
        await context.sync();
        return range.address;
      });

      if (!address) {
        setError('Please select a data range in Excel first.');
        return;
      }

      setRangeAddress(address);

      // Create or get table
      const name = await ensureTable(address, 'VariScoutData');
      setTableName(name);

      // Detect column types
      const types = await detectColumnTypes(name);
      setNumericColumns(types.numeric);
      setCategoricalColumns(types.categorical);

      // Auto-select first numeric as outcome
      if (types.numeric.length > 0) {
        setOutcomeColumn(types.numeric[0]);
      }

      // Auto-select categorical columns as potential factors
      if (types.categorical.length > 0) {
        setFactorColumns(types.categorical.slice(0, 3));
      }

      setCurrentStep('columns');
    } catch (err) {
      console.error('Error creating table:', err);
      setError(
        'Could not create table. Ensure your selection includes headers in the first row and contains at least two rows of data.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 2 → Step 3: Create slicers
  const handleColumnsNext = useCallback(async () => {
    if (!outcomeColumn) {
      setError('Please select an outcome column.');
      return;
    }
    setError(null);
    setCurrentStep('slicers');
  }, [outcomeColumn]);

  // Step 3 → Step 4: Optionally create slicers, then proceed
  const handleSlicersNext = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (createSlicers && slicerSupported && factorColumns.length > 0) {
        const names = await createSlicerRow(tableName, factorColumns);
        setSlicerNames(names);
      }
      setCurrentStep('specs');
    } catch (err) {
      console.error('Error creating slicers:', err);
      setError('Failed to create slicers. You can skip this step and continue.');
    } finally {
      setIsLoading(false);
    }
  }, [createSlicers, slicerSupported, factorColumns, tableName]);

  // Step 4 → Complete: Save state
  const handleSpecsNext = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate spec inputs
      const specs: { usl?: number; lsl?: number; target?: number } = {};

      if (usl) {
        const uslNum = parseFloat(usl);
        if (isNaN(uslNum)) {
          setError('USL must be a valid number.');
          setIsLoading(false);
          return;
        }
        specs.usl = uslNum;
      }

      if (lsl) {
        const lslNum = parseFloat(lsl);
        if (isNaN(lslNum)) {
          setError('LSL must be a valid number.');
          setIsLoading(false);
          return;
        }
        specs.lsl = lslNum;
      }

      if (target) {
        const targetNum = parseFloat(target);
        if (isNaN(targetNum)) {
          setError('Target must be a valid number.');
          setIsLoading(false);
          return;
        }
        specs.target = targetNum;
      }

      // Validate LSL < USL
      if (specs.lsl !== undefined && specs.usl !== undefined && specs.lsl >= specs.usl) {
        setError('LSL must be less than USL.');
        setIsLoading(false);
        return;
      }

      const state = createInitialState(rangeAddress, tableName, outcomeColumn, factorColumns);
      state.specs = specs;
      state.slicerNames = slicerNames;

      await saveAddInState(state);

      setCurrentStep('complete');
      onComplete(state);
    } catch (err) {
      console.error('Error saving state:', err);
      setError(
        'Could not save configuration. Try closing and reopening the add-in, then run setup again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    usl,
    lsl,
    target,
    rangeAddress,
    tableName,
    outcomeColumn,
    factorColumns,
    slicerNames,
    onComplete,
  ]);

  const handleBack = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const toggleFactorColumn = (col: string) => {
    setFactorColumns(prev => (prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]));
  };

  return (
    <div className={styles.container}>
      {/* Progress */}
      <div className={styles.progressContainer}>
        <Caption1>
          Step {stepIndex + 1} of {steps.length}
        </Caption1>
        <ProgressBar value={progress} />
      </div>

      {/* Step 1: Select Data */}
      {currentStep === 'data' && (
        <Card className={styles.card}>
          <div className={styles.stepHeader}>
            <TableSimple24Regular className={styles.stepIcon} />
            <Body1 className={styles.stepTitle}>Select Data Range</Body1>
          </div>
          <Body2 className={styles.stepDescription}>
            Select a range in Excel that contains your data with headers in the first row. This will
            be converted to an Excel Table for filtering.
          </Body2>

          <Button
            appearance="primary"
            onClick={handleGetSelection}
            disabled={isLoading}
            icon={isLoading ? <Spinner size="tiny" /> : undefined}
          >
            {isLoading ? 'Reading Selection...' : 'Get Selected Range'}
          </Button>

          {rangeAddress && (
            <Body2 style={{ marginTop: tokens.spacingVerticalM }}>
              Selected: <strong>{rangeAddress}</strong>
            </Body2>
          )}

          {error && (
            <Body2
              style={{
                color: tokens.colorPaletteRedForeground1,
                marginTop: tokens.spacingVerticalS,
              }}
            >
              {error}
            </Body2>
          )}
        </Card>
      )}

      {/* Step 2: Configure Columns */}
      {currentStep === 'columns' && (
        <Card className={styles.card}>
          <div className={styles.stepHeader}>
            <Settings24Regular className={styles.stepIcon} />
            <Body1 className={styles.stepTitle}>Configure Columns</Body1>
          </div>
          <Body2 className={styles.stepDescription}>
            Select which column contains your outcome variable (measurement) and which columns are
            factors for grouping.
          </Body2>

          <div className={styles.formGroup}>
            <Field label="Outcome Column (Y)" required>
              <Dropdown
                value={outcomeColumn}
                onOptionSelect={(_, data) => setOutcomeColumn(data.optionValue as string)}
              >
                {numericColumns.map(col => (
                  <Option key={col} value={col}>
                    {col}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </div>

          <div className={styles.formGroup}>
            <Field label="Factor Columns (X) - for filtering">
              <div className={styles.checkboxGroup}>
                {categoricalColumns.map(col => (
                  <Checkbox
                    key={col}
                    label={col}
                    checked={factorColumns.includes(col)}
                    onChange={() => toggleFactorColumn(col)}
                  />
                ))}
                {categoricalColumns.length === 0 && (
                  <Caption1>No categorical columns detected</Caption1>
                )}
              </div>
            </Field>
          </div>

          {error && <Body2 style={{ color: tokens.colorPaletteRedForeground1 }}>{error}</Body2>}
        </Card>
      )}

      {/* Step 3: Create Slicers */}
      {currentStep === 'slicers' && (
        <Card className={styles.card}>
          <div className={styles.stepHeader}>
            <Filter24Regular className={styles.stepIcon} />
            <Body1 className={styles.stepTitle}>Create Slicers</Body1>
          </div>
          <Body2 className={styles.stepDescription}>
            Slicers provide visual filtering controls in Excel. When you click a slicer, the charts
            will automatically update.
          </Body2>

          {slicerSupported ? (
            <>
              <Checkbox
                label="Create slicers for factor columns"
                checked={createSlicers}
                onChange={(_, data) => setCreateSlicers(!!data.checked)}
              />

              {createSlicers && factorColumns.length > 0 && (
                <Body2 style={{ marginTop: tokens.spacingVerticalS }}>
                  Slicers will be created for: {factorColumns.join(', ')}
                </Body2>
              )}

              {createSlicers && factorColumns.length === 0 && (
                <Caption1 className={styles.warning}>
                  No factor columns selected. Go back to add factors, or skip slicers.
                </Caption1>
              )}
            </>
          ) : (
            <Body2 className={styles.warning}>
              Slicers require Excel 2021 or Microsoft 365. Your version uses Table AutoFilter
              instead — you can filter data directly by clicking the dropdown arrows in the table
              header row.
            </Body2>
          )}

          {error && (
            <Body2
              style={{
                color: tokens.colorPaletteRedForeground1,
                marginTop: tokens.spacingVerticalS,
              }}
            >
              {error}
            </Body2>
          )}
        </Card>
      )}

      {/* Step 4: Set Specs */}
      {currentStep === 'specs' && (
        <Card className={styles.card}>
          <div className={styles.stepHeader}>
            <ChartMultiple24Regular className={styles.stepIcon} />
            <Body1 className={styles.stepTitle}>Specification Limits</Body1>
          </div>
          <Body2 className={styles.stepDescription}>
            Optionally set specification limits for conformance analysis. Leave blank to skip.
          </Body2>

          <div className={styles.specInputRow}>
            <Field label="LSL (Lower)" className={styles.specInput}>
              <Input
                type="number"
                value={lsl}
                onChange={(_, data) => setLsl(data.value)}
                placeholder="Lower limit"
              />
            </Field>
            <Field label="Target" className={styles.specInput}>
              <Input
                type="number"
                value={target}
                onChange={(_, data) => setTarget(data.value)}
                placeholder="Target"
              />
            </Field>
            <Field label="USL (Upper)" className={styles.specInput}>
              <Input
                type="number"
                value={usl}
                onChange={(_, data) => setUsl(data.value)}
                placeholder="Upper limit"
              />
            </Field>
          </div>

          {error && (
            <Body2
              style={{
                color: tokens.colorPaletteRedForeground1,
                marginTop: tokens.spacingVerticalS,
              }}
            >
              {error}
            </Body2>
          )}
        </Card>
      )}

      {/* Step 5: Complete */}
      {currentStep === 'complete' && (
        <Card className={styles.successCard}>
          <div className={styles.successIcon}>
            <Checkmark24Regular />
          </div>
          <Body1 className={styles.stepTitle}>Setup Complete!</Body1>
          <Body2 style={{ marginTop: tokens.spacingVerticalM }}>
            Your data is configured. The charts will now respond to slicer selections.
          </Body2>
          <Body2 style={{ marginTop: tokens.spacingVerticalS }}>
            To view charts, insert the VariScout Charts content add-in into your worksheet.
          </Body2>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className={styles.buttonRow}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={currentStep === 'data' ? onCancel : handleBack}
          disabled={isLoading || currentStep === 'complete'}
        >
          {currentStep === 'data' ? 'Cancel' : 'Back'}
        </Button>

        {currentStep !== 'complete' && (
          <Button
            appearance="primary"
            icon={<ArrowRight24Regular />}
            iconPosition="after"
            onClick={
              currentStep === 'data'
                ? handleGetSelection
                : currentStep === 'columns'
                  ? handleColumnsNext
                  : currentStep === 'slicers'
                    ? handleSlicersNext
                    : handleSpecsNext
            }
            disabled={isLoading || (currentStep === 'data' && !rangeAddress && !isLoading)}
          >
            {isLoading ? 'Processing...' : currentStep === 'specs' ? 'Finish' : 'Next'}
          </Button>
        )}

        {currentStep === 'complete' && (
          <Button appearance="primary" onClick={() => onComplete({} as AddInState)}>
            Done
          </Button>
        )}
      </div>
    </div>
  );
};
