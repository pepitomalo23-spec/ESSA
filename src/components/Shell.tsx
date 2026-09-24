import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// Marco de la parte del alumno: cabecera blanca con el logotipo y una columna de lectura estrecha.
export function Shell({ children, context, footer }: { children: ReactNode; context?: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[640px] items-center justify-between gap-4 px-4">
          <Logo className="h-9 sm:h-10" />
          <div className="flex items-center gap-2">
            {context}
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:py-12">{children}</main>
      {footer && <footer className="mx-auto w-full max-w-[640px] px-4 pb-8 text-sm text-muted">{footer}</footer>}
    </div>
  );
}
