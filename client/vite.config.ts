import { defineConfig } from "vite";
import path from "path";

// QA test hooks (window.__a2a.test + ?qa=1 isolation) are compiled in only for
// local dev (`vite` serve) and preview builds that set VITE_QA_HOOKS=1. Injected as
// a real boolean literal so the production build (no flag) dead-code-eliminates the
// whole block — incl. the consent-bypassing autoAcceptPairs — from the bundle.
export default defineConfig(({ mode }) => ({
  define: {
    __A2A_QA__: JSON.stringify(mode === "development" || process.env.VITE_QA_HOOKS === "1"),
  },
  resolve: {
    alias: {
      "@globefly/shared": path.resolve(__dirname, "../shared"),
    },
  },
  server: {
    port: 5173,
    /** Bind IPv4 + IPv6; otherwise on some systems only ::1 works and `localhost` → 127.0.0.1 fails. */
    host: true,
  },
}));
