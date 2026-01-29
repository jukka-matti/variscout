/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDITION?: 'licensed';
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
