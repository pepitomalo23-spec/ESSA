import { Check, ClipboardCheck, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Google no permite mostrar su formulario de reseñas dentro de otra web (X-Frame-Options: SAMEORIGIN)
// ni publicar reseñas en nombre del usuario. Lo más cercano: abrir el formulario directamente
// (en el móvil, en la app de Google Maps con la cuenta del alumno; en el ordenador, en una ventana
// pequeña encima de la app), llevar ya copiado su comentario y darle las gracias al volver.
export function GoogleReview({ url, comment, rating }: { url: string; comment: string; rating: number }) {
  const [state, setState] = useState<"idle" | "open" | "done">("idle");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  // Al volver a la app (móvil) consideramos la reseña hecha.
  useEffect(() => {
    if (state !== "open") return;
    const onBack = () => document.visibilityState === "visible" && setState("done");
    const t = setTimeout(() => document.addEventListener("visibilitychange", onBack), 800);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", onBack);
    };
  }, [state]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  function open() {
    const text = comment.trim();
    // Todo en el mismo clic: el navegador solo permite copiar y abrir ventanas durante el gesto.
    if (text && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => setCopied(true),
        () => setCopied(false),
      );
    }
    const touch = window.matchMedia("(pointer: coarse)").matches;
    let win: Window | null = null;
    if (touch) {
      win = window.open(url, "_blank");
    } else {
      const w = 560;
      const h = 760;
      const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
      const top = Math.round(window.screenY + Math.max(0, (window.outerHeight - h) / 2));
      win = window.open(url, "essa-resena", `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
      if (win) {
        window.clearInterval(timer.current);
        timer.current = window.setInterval(() => {
          if (win?.closed) {
            window.clearInterval(timer.current);
            setState("done");
          }
        }, 700);
      }
    }
    if (!win) window.open(url, "_blank", "noopener");
    setState("open");
  }

  if (state === "done")
    return (
      <div>
        <h2 className="display flex items-center gap-2 text-2xl text-ink">
          <Check size={22} className="text-green" /> ¡Muchas gracias por tu reseña!
        </h2>
        <p className="mt-1 text-[15px] text-ink2">Ayuda a que otros alumnos encuentren la escuela.</p>
        <button className="btn btn-ghost btn-sm mt-3 -ml-3" onClick={open}>
          ¿No llegaste a publicarla? Ábrela otra vez
        </button>
      </div>
    );

  return (
    <div>
      <h2 className="display text-2xl text-ink">¡Gracias! ¿Lo cuentas en Google?</h2>
      <p className="mt-1 text-[15px] text-ink2">
        Se abrirá la ficha de la escuela en Google, ya en la ventana de reseña y con tu cuenta.{" "}
        {comment.trim() ? "Tu comentario irá copiado: solo tienes que pegarlo y marcar " : "Solo tienes que marcar "}
        {rating} {rating === 1 ? "estrella" : "estrellas"}.
      </p>

      <button className="btn btn-primary btn-lg mt-5 w-full sm:w-auto" onClick={open}>
        <GoogleMark /> Escribir reseña en Google
      </button>

      {state === "open" && (
        <div className="mt-4 space-y-2">
          {copied && (
            <p className="flex items-start gap-2 text-sm text-green">
              <ClipboardCheck size={16} className="mt-0.5 shrink-0" /> Comentario copiado. En Google, mantén pulsado el cuadro de texto y elige «Pegar».
            </p>
          )}
          <p className="text-sm text-muted">
            ¿No se ha abierto?{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-navy underline-offset-2 hover:underline">
              Abrir la reseña <ExternalLink size={13} />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="rounded-full bg-white p-[2px]">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
