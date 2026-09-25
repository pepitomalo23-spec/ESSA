import { useEffect, useState } from "react";

// Instalar la web como app (pantalla de inicio).
// Chrome/Edge/Samsung avisan con `beforeinstallprompt` y dejan instalar con un toque; puede llegar antes de que
// se monte el panel, por eso se escucha desde el arranque. Safari (iPhone) no lo permite: hay que explicar los pasos.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallEvent | null = null;
let installed = isStandalone();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as InstallEvent;
  notify();
});
window.addEventListener("appinstalled", () => {
  installed = true;
  deferred = null;
  notify();
});

const ua = navigator.userAgent;
export const platform: "ios" | "android" | "desktop" =
  /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) ? "ios" : /android/i.test(ua) ? "android" : "desktop";

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return {
    installed,
    /** El navegador instala con un toque. */
    oneTap: !!deferred,
    async install() {
      if (!deferred) return false;
      const e = deferred;
      deferred = null;
      await e.prompt();
      const { outcome } = await e.userChoice;
      if (outcome === "accepted") installed = true;
      notify();
      return outcome === "accepted";
    },
  };
}

// Para abrir el aviso a mano desde el panel (botón «Instalar app»).
export const openInstall = () => window.dispatchEvent(new Event("essa-install"));
