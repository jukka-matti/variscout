import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Body1,
  Caption1,
  Input,
  Label,
  Button,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  DataBarVertical24Regular,
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  ArrowTrendingLines24Regular,
} from '@fluentui/react-icons';
import { calculateStats } from '@variscout/core';
import { SelectedData, highlightOutOfSpec } from '../../lib/excelData';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  specInputs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
  },
  statCard: {
    padding: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  conformanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalS,
  },
  passRate: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  buttonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
});

interface StatsDisplayProps {
  data: SelectedData;
  specs: { usl?: number; lsl?: number };
  onSpecsChange: (specs: { usl?: number; lsl?: number }) => void;
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({ data, specs, onSpecsChange }) => {
  const styles = useStyles();

  // Local state for input values (for responsive typing)
  const [localUsl, setLocalUsl] = useState(specs.usl?.toString() || '');
  const [localLsl, setLocalLsl] = useState(specs.lsl?.toString() || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when props change (e.g., from loading saved state)
  useEffect(() => {
    setLocalUsl(specs.usl?.toString() || '');
    setLocalLsl(specs.lsl?.toString() || '');
  }, [specs.usl, specs.lsl]);

  // Debounced spec change propagation
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const newUsl = localUsl ? Number(localUsl) : undefined;
      const newLsl = localLsl ? Number(localLsl) : undefined;

      // Only update if values actually changed
      if (newUsl !== specs.usl || newLsl !== specs.lsl) {
        onSpecsChange({ usl: newUsl, lsl: newLsl });
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localUsl, localLsl, specs.usl, specs.lsl, onSpecsChange]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateStats(data.values, specs.usl, specs.lsl);
  }, [data.values, specs]);

  // Calculate conformance
  const conformance = useMemo(() => {
    let pass = 0;
    let failUsl = 0;
    let failLsl = 0;

    data.values.forEach(val => {
      if (specs.usl !== undefined && val > specs.usl) {
        failUsl++;
      } else if (specs.lsl !== undefined && val < specs.lsl) {
        failLsl++;
      } else {
        pass++;
      }
    });

    const total = data.values.length;
    return {
      pass,
      failUsl,
      failLsl,
      total,
      passRate: total > 0 ? (pass / total) * 100 : 0,
    };
  }, [data.values, specs]);

  const handleUslChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalUsl(e.target.value);
  };

  const handleLslChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalLsl(e.target.value);
  };

  const handleHighlight = async () => {
    try {
      await highlightOutOfSpec(data.address, specs.usl, specs.lsl);
    } catch (err) {
      console.error('Failed to highlight cells:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Specification Limits */}
      <Card>
        <CardHeader
          image={<DataBarVertical24Regular />}
          header={<Body1>Specification Limits</Body1>}
          description={<Caption1>Set USL and LSL for capability analysis</Caption1>}
        />

        <div className={styles.specInputs}>
          <div className={styles.inputGroup}>
            <Label htmlFor="usl-input">Upper Spec (USL)</Label>
            <Input
              id="usl-input"
              type="number"
              value={localUsl}
              onChange={handleUslChange}
              placeholder="e.g., 15"
            />
          </div>
          <div className={styles.inputGroup}>
            <Label htmlFor="lsl-input">Lower Spec (LSL)</Label>
            <Input
              id="lsl-input"
              type="number"
              value={localLsl}
              onChange={handleLslChange}
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <div className={styles.buttonRow}>
          <Button
            appearance="secondary"
            onClick={handleHighlight}
            disabled={!specs.usl && !specs.lsl}
          >
            Highlight in Excel
          </Button>
        </div>
      </Card>

      {/* Process Statistics */}
      <Card>
        <CardHeader
          image={<ArrowTrendingLines24Regular />}
          header={<Body1>Process Statistics</Body1>}
        />

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.mean.toFixed(2)}</div>
            <div className={styles.statLabel}>Mean</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.stdDev.toFixed(3)}</div>
            <div className={styles.statLabel}>Std Dev</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.ucl.toFixed(2)}</div>
            <div className={styles.statLabel}>UCL (3σ)</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.lcl.toFixed(2)}</div>
            <div className={styles.statLabel}>LCL (3σ)</div>
          </div>
        </div>

        {/* Capability Indices */}
        {(specs.usl !== undefined || specs.lsl !== undefined) && (
          <>
            <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />
            <div className={styles.statsGrid}>
              {stats.cp !== undefined && (
                <div className={styles.statCard}>
                  <div
                    className={styles.statValue}
                    style={{
                      color:
                        stats.cp >= 1.33
                          ? tokens.colorPaletteGreenForeground1
                          : stats.cp >= 1
                            ? tokens.colorPaletteMarigoldForeground1
                            : tokens.colorPaletteRedForeground1,
                    }}
                  >
                    {stats.cp.toFixed(2)}
                  </div>
                  <div className={styles.statLabel}>Cp</div>
                </div>
              )}
              {stats.cpk !== undefined && (
                <div className={styles.statCard}>
                  <div
                    className={styles.statValue}
                    style={{
                      color:
                        stats.cpk >= 1.33
                          ? tokens.colorPaletteGreenForeground1
                          : stats.cpk >= 1
                            ? tokens.colorPaletteMarigoldForeground1
                            : tokens.colorPaletteRedForeground1,
                    }}
                  >
                    {stats.cpk.toFixed(2)}
                  </div>
                  <div className={styles.statLabel}>Cpk</div>
                </div>
              )}
            </div>
          </>
        )}
      </Card>

      {/* Conformance Summary */}
      {(specs.usl !== undefined || specs.lsl !== undefined) && (
        <Card>
          <CardHeader image={<CheckmarkCircle24Regular />} header={<Body1>Conformance</Body1>} />

          <div className={styles.conformanceRow}>
            <div className={styles.passRate}>
              <CheckmarkCircle24Regular style={{ color: tokens.colorPaletteGreenForeground1 }} />
              <span>Pass</span>
            </div>
            <Badge appearance="filled" color="success">
              {conformance.pass} ({conformance.passRate.toFixed(1)}%)
            </Badge>
          </div>

          {specs.usl !== undefined && (
            <div className={styles.conformanceRow}>
              <div className={styles.passRate}>
                <DismissCircle24Regular style={{ color: tokens.colorPaletteRedForeground1 }} />
                <span>Above USL</span>
              </div>
              <Badge appearance="filled" color="danger">
                {conformance.failUsl}
              </Badge>
            </div>
          )}

          {specs.lsl !== undefined && (
            <div className={styles.conformanceRow}>
              <div className={styles.passRate}>
                <DismissCircle24Regular style={{ color: tokens.colorPaletteMarigoldForeground1 }} />
                <span>Below LSL</span>
              </div>
              <Badge appearance="filled" color="warning">
                {conformance.failLsl}
              </Badge>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
