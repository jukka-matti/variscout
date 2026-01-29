/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDITION?: 'community' | 'licensed';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
