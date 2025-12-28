/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EDITION?: 'community' | 'itc' | 'pro';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
