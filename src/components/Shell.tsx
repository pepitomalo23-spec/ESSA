import { WifiOff } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useOnline } from "../lib/useOnline";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// Marco de la parte del alumno, como una app: la cabecera no se mueve y solo desplaza el contenido.
// Con `hero`, la cabecera se funde con la banda azul de bienvenida y el azul sigue más allá del borde al estirar.
export function Shell({
  children,
  context,
  footerLink,
  hero,
}: {
  children: ReactNode;
  context?: ReactNode;
  footerLink?: ReactNode;
  hero?: ReactNode;
}) {
  const online = useOnline();
  const brand = !!hero;

  // La barra del navegador del móvil (theme-color) y el lienzo de fondo toman el mismo azul.
  useEffect(() => {
    if (!brand) return;
    const root = document.documentElement;
    root.dataset.brand = "";
    const metas = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')];
    const before = metas.map((m) => m.content);
    const deep = getComputedStyle(root).getPropertyValue("--brand-deep").trim() || "#0f2c52";
    metas.forEach((m) => (m.content = deep));
    return () => {
      delete root.dataset.brand;
      metas.forEach((m, i) => (m.content = before[i]));
    };
  }, [brand]);

  return (
    <div className="flex h-full flex-col">
      <header
        className={`z-30 shrink-0 border-b pt-[env(safe-area-inset-top)] ${brand ? "border-transparent bg-brand-deep text-white" : "border-line bg-surface"}`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[640px] items-center justify-between gap-4 px-4">
          <a href="/" aria-label="Evaluación ESSA, inicio">
            <Logo className="h-9 sm:h-10" chip={brand} />
          </a>
          <div className="flex items-center gap-3">
            {context}
            <ThemeToggle className={brand ? "text-white/75 hover:bg-white/10 hover:text-white" : ""} />
          </div>
        </div>
        {!online && (
          <div className="border-t border-amber/30 bg-amber-soft" role="status">
            <p className="mx-auto flex max-w-[640px] items-center gap-2 px-4 py-2 text-sm font-medium text-amber">
              <WifiOff size={15} className="shrink-0" /> Sin conexión. Lo que ya has respondido está guardado; espera a recuperar la señal.
            </p>
          </div>
        )}
      </header>

      <div id="scroll-root" className={`scroll-area flex min-h-0 flex-1 flex-col ${brand ? "brand-top" : ""}`}>
        {hero}
        <div className="flex-1 bg-bg">
          <main className="mx-auto w-full max-w-[640px] px-4 py-8 sm:py-12">{children}</main>
        </div>
        <footer className="border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex w-full max-w-[640px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-5 text-sm text-muted">
            <span>Escuela de Salvamento y Socorrismo Acuático</span>
            {footerLink ?? (
              <span>
                Emergencias: <strong className="font-semibold text-ink">112</strong>
              </span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
