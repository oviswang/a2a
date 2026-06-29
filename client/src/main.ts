import { Game } from "./game/Game";
import { ProgressionManager } from "./game/ProgressionManager";
import { enableWakeLock } from "./runtime/wakeLock";
import { initInstallPrompt } from "./runtime/installPrompt";
import { inject } from "@vercel/analytics";

// Initialize Vercel Web Analytics
inject({
  mode: import.meta.env.PROD ? "production" : "development",
});

if (import.meta.env.DEV) {
  const params = new URLSearchParams(window.location.search);
  if (params.has("clearSave")) {
    ProgressionManager.clearAll();
    params.delete("clearSave");
    const q = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`,
    );
  }
}

const app = document.getElementById("app")!;
const game = new Game(app);
game.start();

// Keep the screen awake while the game is open (no dimming / screensaver).
enableWakeLock();

// PWA: register the service worker + show the install guidance (2nd visit onward).
initInstallPrompt();

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    game.dispose();
    app.innerHTML = "";
  });
}
