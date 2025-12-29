import React, { useState, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Title3,
  Body1,
  Tab,
  TabList,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import { DataSelector } from './components/DataSelector';
import { ChartPanel } from './components/ChartPanel';
import { StatsDisplay } from './components/StatsDisplay';
import { SelectedData } from '../lib/excelData';

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
});

type TabValue = 'data' | 'chart' | 'stats';

const App: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TabValue>('data');
  const [selectedData, setSelectedData] = useState<SelectedData | null>(null);
  const [specs, setSpecs] = useState<{ usl?: number; lsl?: number }>({});

  const handleTabSelect = useCallback((_event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as TabValue);
  }, []);

  const handleDataSelected = useCallback((data: SelectedData) => {
    setSelectedData(data);
    // Auto-switch to chart tab when data is selected
    setSelectedTab('chart');
  }, []);

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <Title3 className={styles.title}>VariScout</Title3>
        <Body1 className={styles.subtitle}>Statistical variation analysis</Body1>
      </div>

      {/* Tab Navigation */}
      <TabList className={styles.tabs} selectedValue={selectedTab} onTabSelect={handleTabSelect}>
        <Tab value="data">Data</Tab>
        <Tab value="chart" disabled={!selectedData}>
          Chart
        </Tab>
        <Tab value="stats" disabled={!selectedData}>
          Stats
        </Tab>
      </TabList>

      {/* Content */}
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
