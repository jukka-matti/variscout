import React, { useState, useEffect, useRef } from 'react';
import ContentDashboard from './ContentDashboard';
import { loadAddInState, type AddInState } from '../lib/stateBridge';
import { darkTheme } from '../lib/darkTheme';

/**
 * Content Add-in Root Component
 *
 * Displays embedded charts in the Excel worksheet.
 * Reads configuration from Custom Document Properties (set by Task Pane).
 */
const App: React.FC = () => {
  const [state, setState] = useState<AddInState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  // Load state from Excel Custom Properties
  useEffect(() => {
    isMountedRef.current = true;

    const loadState = async () => {
      // Prevent overlapping requests
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        const savedState = await loadAddInState();
        // Only update state if still mounted
        if (isMountedRef.current) {
          setState(savedState);
        }
      } catch (err: unknown) {
        console.error('Failed to load state:', err);
        if (isMountedRef.current) {
          setError(
            'Could not load configuration. Use the VariScout Task Pane to set up your analysis first.'
          );
        }
      } finally {
        isLoadingRef.current = false;
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadState();

    // Poll for state changes (Task Pane may update it)
    const interval = setInterval(loadState, 2000);
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <p style={styles.errorHint}>Open the Task Pane from the ribbon to configure.</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div style={styles.setupPrompt}>
        <div style={styles.setupIcon}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <h2 style={styles.setupTitle}>No Data Configured</h2>
        <p style={styles.setupDescription}>
          Open the VariScout Task Pane to set up your data analysis.
        </p>
        <ol style={styles.setupSteps}>
          <li>Click "VariScout" in the Data tab on the ribbon</li>
          <li>Select your data range in Excel</li>
          <li>Configure columns and specifications</li>
        </ol>
      </div>
    );
  }

  return <ContentDashboard state={state} />;
};

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: darkTheme.colorNeutralBackground1,
    color: darkTheme.colorNeutralForeground2,
  },
  spinner: {
    width: 24,
    height: 24,
    border: `2px solid ${darkTheme.colorNeutralStroke1}`,
    borderTopColor: darkTheme.colorBrandForeground1,
    borderRadius: darkTheme.borderRadiusCircular,
    animation: 'spin 1s linear infinite',
    marginBottom: darkTheme.spacingM,
  },
  loadingText: {
    fontSize: darkTheme.fontSizeBody,
    color: darkTheme.colorNeutralForeground2,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: darkTheme.colorNeutralBackground1,
    padding: darkTheme.spacingL,
    textAlign: 'center',
  },
  errorText: {
    color: darkTheme.colorStatusDangerForeground,
    fontSize: darkTheme.fontSizeBody,
    marginBottom: darkTheme.spacingS,
  },
  errorHint: {
    color: darkTheme.colorNeutralForeground2,
    fontSize: darkTheme.fontSizeSmall,
  },
  setupPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: darkTheme.colorNeutralBackground1,
    color: darkTheme.colorNeutralForeground1,
    padding: darkTheme.spacingL,
    textAlign: 'center',
  },
  setupIcon: {
    color: darkTheme.colorBrandForeground1,
    marginBottom: darkTheme.spacingL,
  },
  setupTitle: {
    fontSize: darkTheme.fontSizeHeading,
    fontWeight: darkTheme.fontWeightSemibold,
    marginBottom: darkTheme.spacingS,
  },
  setupDescription: {
    fontSize: darkTheme.fontSizeBody,
    color: darkTheme.colorNeutralForeground2,
    marginBottom: darkTheme.spacingL,
  },
  setupSteps: {
    textAlign: 'left',
    fontSize: 13,
    color: darkTheme.colorNeutralForeground1,
    lineHeight: 1.8,
    paddingLeft: darkTheme.spacingL,
  },
};

export default App;
