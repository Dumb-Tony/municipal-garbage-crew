(function exposeMunicipalGarbageAppShell(root, factory) {
  const shell = factory();
  if (typeof module === "object" && module.exports) module.exports = shell;
  else root.MGCAppShell = shell;
  if (typeof document !== "undefined") shell.initializeBrowserShell();
})(typeof globalThis !== "undefined" ? globalThis : this, function createMunicipalGarbageAppShell() {
  "use strict";

  const BUILD_VERSION = "0.17.0";
  const CACHE_PREFIX = "municipal-garbage-crew-";
  const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;
  const SHELL_ASSETS = Object.freeze([
    "./",
    "./index.html",
    `./styles.css?v=${BUILD_VERSION}`,
    `./rules.js?v=${BUILD_VERSION}`,
    `./input.js?v=${BUILD_VERSION}`,
    `./timing.js?v=${BUILD_VERSION}`,
    `./contracts.js?v=${BUILD_VERSION}`,
    `./game.js?v=${BUILD_VERSION}`,
    `./pwa.js?v=${BUILD_VERSION}`,
    "./manifest.webmanifest",
    "./assets/bsa-icon.svg",
    "./assets/bsa-icon-192.png",
    "./assets/bsa-icon-512.png",
    "./assets/bellwether-noir-title-v2.png"
  ]);

  function initializeBrowserShell() {
    const installButton = document.querySelector("#installButton");
    const status = document.querySelector("#offlineStatus");
    if (!installButton || !status) return;
    let deferredPrompt = null;
    const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    if (standalone) status.textContent = "Installed // offline ready";

    addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      deferredPrompt = event;
      installButton.classList.remove("hidden");
      status.textContent = "Install available // offline cache ready";
    });
    addEventListener("appinstalled", () => {
      deferredPrompt = null;
      installButton.classList.add("hidden");
      status.textContent = "Installed // offline ready";
    });
    installButton.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome !== "accepted") status.textContent = "Install dismissed // browser play unchanged";
      deferredPrompt = null;
      installButton.classList.add("hidden");
    });

    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      status.textContent = location.protocol === "file:" ? "Local file // online install unavailable" : "Online only // service worker unavailable";
      return;
    }
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .then(() => navigator.serviceWorker.ready)
      .then(() => { if (!standalone && !deferredPrompt) status.textContent = "Offline ready // install from browser menu"; })
      .catch(() => { status.textContent = "Online ready // offline cache unavailable"; });
  }

  return Object.freeze({ BUILD_VERSION, CACHE_PREFIX, CACHE_NAME, SHELL_ASSETS, initializeBrowserShell });
});
