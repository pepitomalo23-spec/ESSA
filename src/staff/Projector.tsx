import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Logo } from "../components/Logo";
import { Qr } from "../components/Qr";
import type { ExamSession } from "../lib/api";
import { formatClock, useCountdown } from "../lib/time";

export const joinUrl = (s: Pick<ExamSession, "city" | "pin">) =>
  `${window.location.origin}/?ciudad=${encodeURIComponent(s.city)}&codigo=${s.pin}`;

// Vista para el proyector o la televisión del aula: dirección, código y QR a tamaño de sala.
export function Projector({ session, waiting, onClose }: { session: ExamSession; waiting: number; onClose: () => void }) {
  const left = useCountdown(session.status === "running" ? session.ends_at : null);

  const close = useRef(onClose);
  close.current = onClose;

  // Pantalla completa una sola vez al abrir; Esc o salir de pantalla completa cierran la vista.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    const onFs = () => !document.fullscreenElement && close.current();
    window.addEventListener("keydown", onKey);
    document.documentElement
      .requestFullscreen?.()
      .then(() => document.addEventListener("fullscreenchange", onFs))
      .catch(() => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);

  const host = window.location.host;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-brand-deep text-white" role="dialog" aria-modal="true" aria-label="Código del examen para proyectar">
      <div className="flex items-center justify-between px-[4vw] py-[3vh]">
        <span className="inline-flex rounded bg-white px-3 py-2">
          <Logo className="h-[5vh] min-h-8" />
        </span>
        <button onClick={onClose} className="btn btn-sm border-white/25 bg-white/10 text-white hover:bg-white/20" aria-label="Cerrar vista de proyector">
          <X size={16} /> Cerrar
        </button>
      </div>

      <div className="grid flex-1 items-center gap-[4vw] px-[6vw] lg:grid-cols-[1fr_auto]">
        <div>
          <p className="display text-[clamp(20px,2.6vw,40px)] tracking-[0.08em] text-white/60 uppercase">Examen · {session.city}</p>
          <p className="mt-[2vh] text-[clamp(18px,2vw,30px)] text-white/80">
            Entra en <strong className="font-semibold text-white">{host}</strong> con el código
          </p>
          <p className="display tnum mt-[1vh] text-[clamp(88px,15vw,240px)] leading-none tracking-[0.06em]">
            {session.pin.slice(0, 3)}
            <span className="text-white/30"> </span>
            {session.pin.slice(3)}
          </p>
          <p className="mt-[3vh] text-[clamp(16px,1.6vw,24px)] text-white/70">
            {session.status === "running"
              ? `Examen en curso · quedan ${formatClock(left)}`
              : `${waiting} ${waiting === 1 ? "alumno" : "alumnos"} en la sala de espera`}
          </p>
        </div>
        <div className="hidden flex-col items-center lg:flex">
          <div className="rounded-lg bg-white p-[1.6vw]">
            <Qr value={joinUrl(session)} className="h-[min(38vh,26vw)] w-[min(38vh,26vw)]" />
          </div>
          <p className="mt-3 text-[clamp(14px,1.3vw,20px)] text-white/70">Escanea con la cámara del móvil</p>
        </div>
      </div>

      <svg className="h-[6vh] w-full opacity-40" viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,20 L270,20 L280,6 L290,34 L300,20 L600,20" fill="none" stroke="#f2574f" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>,
    document.body,
  );
}
