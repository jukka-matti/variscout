import React, { useState, useEffect, useRef, useMemo } from 'react';
import ContentDashboard from './ContentDashboard';
import { loadAddInState, type AddInState } from '../lib/stateBridge';
import { useContentTheme, type ThemeTokens } from './ThemeContext';

/**
 * Create styles object based on theme tokens
 */
const createStyles = (theme: ThemeTokens): Record<string, React.CSSProperties> => ({
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: theme.colorNeutralBackground1,
    color: theme.colorNeutralForeground2,
  },
  spinner: {
    width: 24,
    height: 24,
    border: `2px solid ${theme.colorNeutralStroke1}`,
    borderTopColor: theme.colorBrandForeground1,
    borderRadius: theme.borderRadiusCircular,
    animation: 'spin 1s linear infinite',
    marginBottom: theme.spacingM,
  },
  loadingText: {
    fontSize: theme.fontSizeBody,
    color: theme.colorNeutralForeground2,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: theme.colorNeutralBackground1,
    padding: theme.spacingL,
    textAlign: 'center',
  },
  errorText: {
    color: theme.colorStatusDangerForeground,
    fontSize: theme.fontSizeBody,
    marginBottom: theme.spacingS,
  },
  errorHint: {
    color: theme.colorNeutralForeground2,
    fontSize: theme.fontSizeSmall,
  },
  setupPrompt: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: theme.colorNeutralBackground1,
    color: theme.colorNeutralForeground1,
    padding: theme.spacingL,
    textAlign: 'center',
  },
  setupIcon: {
    color: theme.colorBrandForeground1,
    marginBottom: theme.spacingL,
  },
  setupTitle: {
    fontSize: theme.fontSizeHeading,
    fontWeight: theme.fontWeightSemibold,
    marginBottom: theme.spacingS,
  },
  setupDescription: {
    fontSize: theme.fontSizeBody,
    color: theme.colorNeutralForeground2,
    marginBottom: theme.spacingL,
  },
  setupSteps: {
    textAlign: 'left',
    fontSize: 13,
    color: theme.colorNeutralForeground1,
    lineHeight: 1.8,
    paddingLeft: theme.spacingL,
  },
});

/**
 * Content Add-in Root Component
 *
 * Displays embedded charts in the Excel worksheet.
 * Reads configuration from Custom Document Properties (set by Task Pane).
 */
const App: React.FC = () => {
  const { theme } = useContentTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

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

export default App;
