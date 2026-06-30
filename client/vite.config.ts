import { defineConfig, loadEnv } from "vite";
import path from "path";

// QA test hooks (window.__a2a.test + ?qa=1 isolation) are compiled in only for
// local dev (`vite` serve) and builds where VITE_QA_HOOKS=1 (env var or the
// committed .env.production). Injected as a real boolean literal so builds without
// the flag dead-code-eliminate the whole block — incl. the consent-bypassing
// autoAcceptPairs — from the bundle. Loaded via loadEnv so .env.production counts.
export default defineConfig(({ mode }) => {
  // Read env from THIS dir (where .env.production lives) so the flag is picked up
  // regardless of the build's working directory on CI/Vercel.
  const env = loadEnv(mode, __dirname, "");
  return {
  define: {
    __A2A_QA__: JSON.stringify(mode === "development" || env.VITE_QA_HOOKS === "1"),
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
  };
});
