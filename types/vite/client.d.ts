declare module "vite/client" {
    interface ImportMetaEnv {
        readonly VITE_APP_TITLE?: string;
        readonly VITE_API_BASE_URL?: string;
        readonly VITE_SUPABASE_URL?: string;
        readonly VITE_SUPABASE_ANON_KEY?: string;
        // add more env vars if needed
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}
