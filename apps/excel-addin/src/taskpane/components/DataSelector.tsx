import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Card,
  CardHeader,
  Body1,
  Caption1,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  TableSimple24Regular,
  ArrowSync24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { getSelectedRangeData, SelectedData } from '../../lib/excelData';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  card: {
    padding: tokens.spacingVerticalM,
  },
  instructions: {
    marginBottom: tokens.spacingVerticalM,
    color: tokens.colorNeutralForeground2,
  },
  buttonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  dataPreview: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
  },
  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalXS,
  },
  previewLabel: {
    color: tokens.colorNeutralForeground2,
  },
  previewValue: {
    fontFamily: 'monospace',
    fontWeight: tokens.fontWeightSemibold,
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorPaletteGreenForeground1,
    marginTop: tokens.spacingVerticalS,
  },
});

interface DataSelectorProps {
  onDataSelected: (data: SelectedData) => void;
  currentData: SelectedData | null;
}

export const DataSelector: React.FC<DataSelectorProps> = ({ onDataSelected, currentData }) => {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSelectedRangeData();

      if (!data) {
        setError('No range selected. Please select cells in Excel.');
        return;
      }

      if (data.values.length === 0) {
        setError('No numeric data found in selection.');
        return;
      }

      onDataSelected(data);
    } catch (err) {
      console.error('Error getting data:', err);
      setError('Failed to read Excel data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onDataSelected]);

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          image={<TableSimple24Regular />}
          header={<Body1>Select Data Range</Body1>}
          description={<Caption1>Choose cells to analyze</Caption1>}
        />

        <Body1 className={styles.instructions}>
          Select a range of numeric data in Excel, then click the button below. The first column
          should contain your measurement values. Optionally, include a second column for grouping
          factors.
        </Body1>

        <div className={styles.buttonRow}>
          <Button
            appearance="primary"
            icon={isLoading ? <Spinner size="tiny" /> : <ArrowSync24Regular />}
            onClick={handleSelectData}
            disabled={isLoading}
          >
            {isLoading ? 'Reading...' : 'Get Selection'}
          </Button>
        </div>

        {error && (
          <Body1
            style={{ color: tokens.colorPaletteRedForeground1, marginTop: tokens.spacingVerticalS }}
          >
            {error}
          </Body1>
        )}

        {currentData && (
          <>
            <div className={styles.successMessage}>
              <Checkmark24Regular />
              <Body1>Data loaded successfully</Body1>
            </div>

            <div className={styles.dataPreview}>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Range:</span>
                <span className={styles.previewValue}>{currentData.address}</span>
              </div>
              <div className={styles.previewRow}>
                <span className={styles.previewLabel}>Data points:</span>
                <Badge appearance="filled" color="brand">
                  n = {currentData.values.length}
                </Badge>
              </div>
              {currentData.header && (
                <div className={styles.previewRow}>
                  <span className={styles.previewLabel}>Column:</span>
                  <span className={styles.previewValue}>{currentData.header}</span>
                </div>
              )}
              {currentData.factors && (
                <div className={styles.previewRow}>
                  <span className={styles.previewLabel}>Factor:</span>
                  <span className={styles.previewValue}>{currentData.factors.column}</span>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
