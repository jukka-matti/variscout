/**
 * Azure Application Insights browser SDK integration.
 *
 * Telemetry goes to the customer's own App Insights instance
 * (connection string from their Azure deployment). No-ops in local dev.
 */

import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

let appInsights: ApplicationInsights | null = null;
const reactPlugin = new ReactPlugin();

/**
 * Initialize App Insights with the customer's connection string.
 * Call once at app startup after loading runtime config.
 * No-ops if connectionString is empty (local dev, tests).
 */
export function initAppInsights(connectionString: string): void {
  if (!connectionString || appInsights) return;

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      extensions: [reactPlugin],
      enableAutoRouteTracking: true,
      disableFetchTracking: false,
      disableAjaxTracking: false,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
    },
  });

  appInsights.loadAppInsights();
}

/**
 * Track an exception (e.g., from ErrorBoundary).
 */
export function trackException(error: Error, severityLevel?: number): void {
  appInsights?.trackException({ exception: error, severityLevel });
}

/**
 * Track a custom event (e.g., analysis completed, AI interaction).
 */
export function trackEvent(name: string, properties?: Record<string, string>): void {
  appInsights?.trackEvent({ name }, properties);
}

/** Get the React plugin for AppInsightsErrorBoundary integration. */
export function getReactPlugin(): ReactPlugin {
  return reactPlugin;
}
