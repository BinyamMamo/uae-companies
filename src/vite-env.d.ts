/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_KEY?: string;
  readonly VITE_PUBLIC_POSTHOG_HOST?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
