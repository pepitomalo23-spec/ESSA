import { useState } from "react";

export function Logo({ className = "h-10" }: { className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className="display text-xl text-ink">ESSA</span>;
  return (
    <img
      src="/logo.png"
      alt="Escuela de Salvamento y Socorrismo Acuático"
      className={`${className} w-auto dark:rounded dark:bg-white dark:px-1.5 dark:py-1`}
      onError={() => setBroken(true)}
    />
  );
}
