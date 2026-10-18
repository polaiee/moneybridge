/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL for production builds. Leave unset locally (the Vite dev server proxies /api). */
  readonly VITE_API_URL?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
