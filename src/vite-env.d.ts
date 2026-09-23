/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_FITZONE_UPI_ID: string;
  readonly VITE_FITZONE_UPI_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
