import { useState } from "react";

export function Logo({ className = "h-12" }: { className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span className="font-display text-xl font-bold text-ink">
        ESSA <span className="text-red">·</span> Salvamento y Socorrismo
      </span>
    );
  }
  return (
    <img
      src="/logo.png"
      alt="Escuela de Salvamento y Socorrismo Acuático"
      className={`${className} w-auto rounded-lg dark:bg-white dark:px-2 dark:py-1`}
      onError={() => setBroken(true)}
    />
  );
}
