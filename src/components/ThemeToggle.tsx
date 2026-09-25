import { Moon, Sun } from "lucide-react";
import { useTheme } from "../lib/useTheme";

export function ThemeToggle({ withLabel = false, className = "" }: { withLabel?: boolean; className?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? "Modo claro" : "Modo oscuro";
  return (
    <button onClick={toggle} className={`btn btn-ghost ${withLabel ? "btn-sm justify-start" : "btn-sm px-2"} ${className}`} aria-label={label} title={label}>
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      {withLabel && label}
    </button>
  );
}
