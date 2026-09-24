import { useEffect, useState } from "react";

// Diferencia entre el reloj del servidor y el del dispositivo, para que la cuenta atrás
// sea la misma en todos los móviles aunque alguno tenga la hora mal.
let offset = 0;
export function syncClock(serverNow: string) {
  offset = new Date(serverNow).getTime() - Date.now();
}
export const serverNow = () => Date.now() + offset;

export function secondsLeft(endsAt: string | null) {
  if (!endsAt) return 0;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - serverNow()) / 1000));
}

export function formatClock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Segundos que quedan, recalculados en cada render: nunca devuelve un valor viejo
// justo después de que cambie la hora de fin.
export function useCountdown(endsAt: string | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => tick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [endsAt]);
  return secondsLeft(endsAt);
}

export const dayKey = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
export const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
