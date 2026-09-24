import { Link } from "react-router-dom";
import { SITE } from "../data/site";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#1E3A5F" />
      <circle cx="32" cy="32" r="16.5" fill="none" stroke="#fff" strokeWidth="7.5" />
      <path d="M32 15.5v6.5M32 42v6.5M15.5 32H22M42 32h6.5" stroke="#DC2626" strokeWidth="7.5" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label={`${SITE.name}, inicio`}>
      <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-45" />
      <span className="leading-none">
        <span className={`block font-display text-lg font-bold ${light ? "text-white" : "text-ink"}`}>
          {SITE.name}
        </span>
        <span
          className={`block text-[9.5px] font-semibold tracking-[0.12em] uppercase ${light ? "text-white/60" : "text-muted"}`}
        >
          Salvamento y Socorrismo
        </span>
      </span>
    </Link>
  );
}
