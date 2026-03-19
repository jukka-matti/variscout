/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  /** Model deployment name for Responses API */
  readonly VITE_RESPONSES_API_DEPLOYMENT?: string;
  /** API key for Responses API (dev/testing; production uses EasyAuth token) */
  readonly VITE_AI_API_KEY?: string;
  /** Application Insights connection string for AI telemetry (team-ai tier only) */
  readonly VITE_APPINSIGHTS_CONNECTION_STRING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
