/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  /** "1" enables the QA test hooks (window.__a2a.test + ?qa=1 sessionStorage
   *  isolation). Set ONLY for local dev / preview builds — never production. */
  readonly VITE_QA_HOOKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Build-time boolean (Vite `define`): true only for dev + preview builds with the
 *  QA test hooks enabled; literal `false` in production so the hooks are tree-shaken. */
declare const __A2A_QA__: boolean;
