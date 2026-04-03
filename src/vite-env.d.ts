/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  /** Optional: POST { lines: string[] } → JSON { dishes: RecipeSuggestion[] } */
  readonly VITE_RECIPE_AI_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
