import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/useTheme";
import { Ecg } from "./Ecg";
import { Logo } from "./Logo";

export function Shell({
  children,
  wide = false,
  ecg,
  footer,
  headerRight,
}: {
  children: ReactNode;
  wide?: boolean;
  ecg?: { current: number; total: number };
  footer?: ReactNode;
  headerRight?: ReactNode;
}) {
  const { theme, toggle } = useTheme();
  return (
    <div className={`shell ${wide ? "shell-wide" : ""}`}>
      <header className="flex items-center justify-between gap-3 pt-5 pb-3">
        <Logo />
        <div className="flex items-center gap-2">
          {headerRight}
          <button
            onClick={toggle}
            className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-paper text-ink2 transition hover:text-ink"
            aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>
      <Ecg current={ecg?.current} total={ecg?.total} />
      <main className="flex-1">{children}</main>
      {footer && <footer className="pt-8 text-center">{footer}</footer>}
    </div>
  );
}
