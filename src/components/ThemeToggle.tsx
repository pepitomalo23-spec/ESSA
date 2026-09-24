import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/useTheme";

export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? "Modo claro" : "Modo oscuro";
  return (
    <button onClick={toggle} className={`btn btn-ghost ${withLabel ? "btn-sm justify-start" : "btn-sm px-2"}`} aria-label={label} title={label}>
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      {withLabel && label}
    </button>
  );
}
