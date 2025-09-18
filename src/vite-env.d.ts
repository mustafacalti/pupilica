/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_STORY_API?: string
  readonly VITE_AI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
