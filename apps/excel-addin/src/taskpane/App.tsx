import React, { useState, useCallback, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Title3,
  Body1,
  Body2,
  Tab,
  TabList,
  SelectTabEvent,
  SelectTabData,
  Button,
  Card,
  Badge,
} from '@fluentui/react-components';
import {
  Settings24Regular,
  ChartMultiple24Regular,
  ArrowReset24Regular,
  Edit24Regular,
} from '@fluentui/react-icons';
import { DataSelector } from './components/DataSelector';
import { ChartPanel } from './components/ChartPanel';
import { StatsDisplay } from './components/StatsDisplay';
import { SetupWizard } from './components/SetupWizard';
import { SelectedData } from '../lib/excelData';
import { loadAddInState, clearAddInState, type AddInState } from '../lib/stateBridge';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  header: {
    padding: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    paddingRight: tokens.spacingHorizontalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  subtitle: {
    color: tokens.colorNeutralForeground2,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingHorizontalL,
  },
  tabs: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  tabContent: {
    padding: tokens.spacingVerticalM,
  },
  modeSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalL,
  },
  modeCard: {
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  modeTitle: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXS,
  },
  configuredBanner: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalM,
  },
  configInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  configRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
});

type TabValue = 'data' | 'chart' | 'stats';
type AppMode = 'select' | 'wizard' | 'simple' | 'configured';

const App: React.FC = () => {
  const styles = useStyles();
  const [mode, setMode] = useState<AppMode>('select');
  const [selectedTab, setSelectedTab] = useState<TabValue>('data');
  const [selectedData, setSelectedData] = useState<SelectedData | null>(null);
  const [specs, setSpecs] = useState<{ usl?: number; lsl?: number }>({});
  const [savedState, setSavedState] = useState<AddInState | null>(null);

  // Check for existing configuration on mount
  useEffect(() => {
    const checkExistingConfig = async () => {
      try {
        const state = await loadAddInState();
        if (state) {
          setSavedState(state);
          setMode('configured');
        }
      } catch (err: unknown) {
        console.error('Failed to load existing state:', err);
      }
    };
    checkExistingConfig();
  }, []);

  const handleTabSelect = useCallback((_event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as TabValue);
  }, []);

  const handleDataSelected = useCallback((data: SelectedData) => {
    setSelectedData(data);
    setSelectedTab('chart');
  }, []);

  const handleWizardComplete = useCallback((state: AddInState) => {
    setSavedState(state);
    setMode('configured');
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await clearAddInState();
      setSavedState(null);
      setMode('select');
    } catch (err: unknown) {
      console.error('Failed to clear state:', err);
    }
  }, []);

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Title3 className={styles.title}>VariScout</Title3>
          <Body1 className={styles.subtitle}>Statistical variation analysis</Body1>
        </div>

        <div className={styles.modeSelector}>
          <Body2>Choose how you want to analyze your data:</Body2>

          <Card
            className={styles.modeCard}
            onClick={() => setMode('wizard')}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMode('wizard');
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
              <ChartMultiple24Regular />
              <div>
                <Body1 className={styles.modeTitle}>Embedded Charts (Recommended)</Body1>
                <Body2>
                  Create Excel Table with Slicers. Charts appear in your worksheet and update when
                  you filter.
                </Body2>
              </div>
            </div>
          </Card>

          <Card
            className={styles.modeCard}
            onClick={() => setMode('simple')}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setMode('simple');
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
              <Settings24Regular />
              <div>
                <Body1 className={styles.modeTitle}>Task Pane Only</Body1>
                <Body2>
                  Quick analysis in this panel. Select data and view charts here without modifying
                  your worksheet.
                </Body2>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Setup Wizard mode
  if (mode === 'wizard') {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <Title3 className={styles.title}>VariScout Setup</Title3>
          <Body1 className={styles.subtitle}>Configure embedded charts</Body1>
        </div>

        <div className={styles.content}>
          <SetupWizard onComplete={handleWizardComplete} onCancel={() => setMode('select')} />
        </div>
      </div>
    );
  }

  // Configured mode (shows current config with option to reconfigure)
  if (mode === 'configured' && savedState) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <Title3 className={styles.title}>VariScout</Title3>
              <Body1 className={styles.subtitle}>Charts configured</Body1>
            </div>
            <Badge appearance="filled" color="success">
              Active
            </Badge>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.configuredBanner}>
            <Body1
              style={{
                fontWeight: tokens.fontWeightSemibold,
                marginBottom: tokens.spacingVerticalS,
              }}
            >
              Configuration Active
            </Body1>
            <div className={styles.configInfo}>
              <div className={styles.configRow}>
                <Body2>Table:</Body2>
                <Body2 style={{ fontFamily: 'monospace' }}>{savedState.tableName}</Body2>
              </div>
              <div className={styles.configRow}>
                <Body2>Outcome:</Body2>
                <Body2 style={{ fontFamily: 'monospace' }}>{savedState.outcomeColumn}</Body2>
              </div>
              {savedState.factorColumns.length > 0 && (
                <div className={styles.configRow}>
                  <Body2>Factors:</Body2>
                  <Body2 style={{ fontFamily: 'monospace' }}>
                    {savedState.factorColumns.join(', ')}
                  </Body2>
                </div>
              )}
              {savedState.slicerNames.length > 0 && (
                <div className={styles.configRow}>
                  <Body2>Slicers:</Body2>
                  <Badge appearance="outline">{savedState.slicerNames.length} active</Badge>
                </div>
              )}
              {(savedState.specs.usl || savedState.specs.lsl) && (
                <div className={styles.configRow}>
                  <Body2>Specs:</Body2>
                  <Body2 style={{ fontFamily: 'monospace' }}>
                    {savedState.specs.lsl !== undefined && `LSL: ${savedState.specs.lsl}`}
                    {savedState.specs.lsl !== undefined &&
                      savedState.specs.usl !== undefined &&
                      ' | '}
                    {savedState.specs.usl !== undefined && `USL: ${savedState.specs.usl}`}
                  </Body2>
                </div>
              )}
              {savedState.specs.cpkTarget && (
                <div className={styles.configRow}>
                  <Body2>Cpk Target:</Body2>
                  <Body2 style={{ fontFamily: 'monospace' }}>{savedState.specs.cpkTarget}</Body2>
                </div>
              )}
            </div>
          </div>

          <Body2 style={{ marginBottom: tokens.spacingVerticalM }}>
            Use the slicers in Excel to filter your data. The embedded charts will update
            automatically.
          </Body2>

          <Body2
            style={{ marginBottom: tokens.spacingVerticalL, color: tokens.colorNeutralForeground2 }}
          >
            To view charts, insert the VariScout Charts content add-in into your worksheet (Insert →
            Add-ins → VariScout Charts).
          </Body2>

          <div className={styles.buttonRow}>
            <Button appearance="primary" icon={<Edit24Regular />} onClick={() => setMode('wizard')}>
              Reconfigure
            </Button>
            <Button appearance="subtle" icon={<ArrowReset24Regular />} onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Simple mode (original task pane flow)
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <Title3 className={styles.title}>VariScout</Title3>
            <Body1 className={styles.subtitle}>Statistical variation analysis</Body1>
          </div>
          <Button appearance="subtle" size="small" onClick={() => setMode('select')}>
            Change Mode
          </Button>
        </div>
      </div>

      <TabList className={styles.tabs} selectedValue={selectedTab} onTabSelect={handleTabSelect}>
        <Tab value="data">Data</Tab>
        <Tab value="chart" disabled={!selectedData}>
          Chart
        </Tab>
        <Tab value="stats" disabled={!selectedData}>
          Stats
        </Tab>
      </TabList>

      <div className={styles.content}>
        {selectedTab === 'data' && (
          <DataSelector onDataSelected={handleDataSelected} currentData={selectedData} />
        )}

        {selectedTab === 'chart' && selectedData && (
          <ChartPanel data={selectedData} specs={specs} />
        )}

        {selectedTab === 'stats' && selectedData && (
          <StatsDisplay data={selectedData} specs={specs} onSpecsChange={setSpecs} />
        )}
      </div>
    </div>
  );
};

export default App;
