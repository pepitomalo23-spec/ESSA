import { useState } from "react";

// `chip`: sobre fondo oscuro el logotipo va en su placa blanca, como en el modo oscuro.
export function Logo({ className = "h-10", chip = false }: { className?: string; chip?: boolean }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span className={`display text-xl ${chip ? "text-white" : "text-ink"}`}>ESSA</span>;
  return (
    <img
      src="/logo.png"
      alt="Escuela de Salvamento y Socorrismo Acuático"
      className={`${className} w-auto ${chip ? "rounded bg-white px-1.5 py-1" : "dark:rounded dark:bg-white dark:px-1.5 dark:py-1"}`}
      onError={() => setBroken(true)}
    />
  );
}
