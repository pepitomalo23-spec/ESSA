import { EllipsisVertical, MonitorDown, Share, SquarePlus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { platform, useInstall } from "../lib/install";

const SEEN = "essa-instalar-visto";
const seen = () => {
  try {
    return localStorage.getItem(SEEN) === "1";
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN, "1");
  } catch {
    /* almacenamiento no disponible */
  }
};

// Aviso para instalar el panel en la pantalla de inicio. Sale solo la primera vez; si se cierra, no pasa nada:
// queda el botón «Instalar app» del menú, que lo vuelve a abrir.
export function InstallPrompt() {
  const { installed, oneTap, install } = useInstall();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const reduce = useReducedMotion();

  // Primera visita: en el móvil siempre (con un toque o con los pasos); en el ordenador, si el navegador puede instalar.
  useEffect(() => {
    if (installed || seen()) return;
    if (oneTap || platform !== "desktop") {
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [installed, oneTap]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("essa-install", onOpen);
    return () => window.removeEventListener("essa-install", onOpen);
  }, []);

  useEffect(() => {
    if (installed) setOpen(false);
  }, [installed]);

  function close() {
    markSeen();
    setOpen(false);
  }

  async function oneTapInstall() {
    setBusy(true);
    const ok = await install();
    setBusy(false);
    if (ok) close();
  }

  const where = platform === "desktop" ? "este ordenador" : "tu móvil";

  return (
    <AnimatePresence>
      {open && !installed && (
        <motion.div
          role="dialog"
          aria-labelledby="install-title"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_-20px_rgb(11_27_47/0.35)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:rounded-lg sm:border sm:pb-5"
        >
          <button className="btn btn-ghost btn-sm absolute top-3 right-3 px-2" onClick={close} aria-label="Cerrar">
            <X size={18} />
          </button>
          <div className="flex items-start gap-4 pr-8">
            <img src="/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl border border-line" />
            <div>
              <h2 id="install-title" className="display text-2xl text-ink">
                Instala ESSA en {where}
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-ink2">
                Tendrás el panel en la pantalla de inicio, como una app: se abre a pantalla completa y entras con un toque.
              </p>
            </div>
          </div>

          {oneTap ? (
            <button className="btn btn-primary btn-lg mt-5 w-full" onClick={oneTapInstall} disabled={busy}>
              {platform === "desktop" ? <MonitorDown size={18} /> : <SquarePlus size={18} />} Instalar
            </button>
          ) : platform === "ios" ? (
            <Steps>
              <Step n={1}>
                Pulsa <Share size={17} className="mx-0.5 inline -translate-y-0.5 text-navy" aria-label="Compartir" /> <strong>Compartir</strong> en la barra del
                navegador.
              </Step>
              <Step n={2}>
                Elige <SquarePlus size={17} className="mx-0.5 inline -translate-y-0.5 text-navy" aria-hidden="true" /> <strong>Añadir a pantalla de inicio</strong>
                .
              </Step>
              <Step n={3}>
                Pulsa <strong>Añadir</strong>.
              </Step>
            </Steps>
          ) : platform === "android" ? (
            <Steps>
              <Step n={1}>
                Abre el menú <EllipsisVertical size={17} className="inline -translate-y-0.5 text-navy" aria-label="Más opciones" /> del navegador.
              </Step>
              <Step n={2}>
                Elige <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.
              </Step>
            </Steps>
          ) : (
            <Steps>
              <Step n={1}>
                En <strong>Chrome</strong> o <strong>Edge</strong>, pulsa el icono de instalar de la barra de direcciones.
              </Step>
              <Step n={2}>
                En <strong>Safari</strong>, menú <strong>Archivo → Añadir al Dock</strong>.
              </Step>
            </Steps>
          )}

          <p className="mt-4 text-sm text-muted">Si ahora no te viene bien, puedes instalarla cuando quieras desde «Instalar app».</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ol className="mt-5 space-y-2.5 rounded-md border border-line bg-sunken p-4 text-[15px] text-ink2">{children}</ol>;
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[22px_1fr] gap-2">
      <span className="display tnum text-lg leading-6 text-red">{n}</span>
      <span>{children}</span>
    </li>
  );
}
