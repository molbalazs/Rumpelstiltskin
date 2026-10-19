/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API URL for development; deployed builds read /config.json instead */
  readonly VITE_API_URL?: string
}
