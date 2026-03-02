declare module 'vite/client' {
  interface ImportMetaEnv {
    readonly VITE_APP_TITLE?: string;
    // add more env vars if needed
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
