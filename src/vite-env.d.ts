/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONCIERGE_WEBHOOK?: string;
  readonly VITE_CONCIERGE_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
