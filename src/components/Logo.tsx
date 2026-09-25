import { useState } from "react";

// Logotipo sin placa: sobre fondo claro, el original; sobre fondo azul (bienvenida, acceso del personal, proyector),
// la versión con las letras y el nadador en blanco.
export function Logo({ className = "h-10", onDark = false }: { className?: string; onDark?: boolean }) {
  const [broken, setBroken] = useState(false);
  const alt = "Escuela de Salvamento y Socorrismo Acuático";
  if (broken) return <span className={`display text-xl ${onDark ? "text-white" : "text-ink"}`}>ESSA</span>;
  return <img src={onDark ? "/logo-light.png" : "/logo.png"} alt={alt} className={`${className} w-auto`} onError={() => setBroken(true)} />;
}
