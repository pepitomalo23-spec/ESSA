import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { COURSES } from "../data/courses";
import { SEDES } from "../data/sedes";
import { SITE } from "../data/site";
import { enviarPreinscripcion, type Preinscripcion } from "../lib/supabase";

type Errors = Partial<Record<keyof Preinscripcion | "privacidad", string>>;

const EMPTY: Preinscripcion = { nombre: "", email: "", telefono: "", curso: "", sede: "", mensaje: "" };

function validate(d: Preinscripcion, privacidad: boolean): Errors {
  const e: Errors = {};
  if (d.nombre.trim().length < 3) e.nombre = "Escribe tu nombre completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) e.email = "Revisa el correo electrónico.";
  if (d.telefono && !/^[+\d][\d\s]{8,15}$/.test(d.telefono.trim())) e.telefono = "Teléfono no válido.";
  if (!d.curso) e.curso = "Elige un curso.";
  if (!d.sede) e.sede = "Elige una sede.";
  if (!privacidad) e.privacidad = "Necesitamos tu consentimiento para contactarte.";
  return e;
}

export function PreinscripcionForm({
  defaultCourse = "",
  defaultSede = "",
}: {
  defaultCourse?: string;
  defaultSede?: string;
}) {
  const [data, setData] = useState<Preinscripcion>({ ...EMPTY, curso: defaultCourse, sede: defaultSede });
  const [privacidad, setPrivacidad] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const set = (k: keyof Preinscripcion) => (v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const mailtoHref = () => {
    const body = `Nombre: ${data.nombre}\nEmail: ${data.email}\nTeléfono: ${data.telefono}\nCurso: ${data.curso}\nSede: ${data.sede}\n\n${data.mensaje}`;
    return `mailto:${SITE.email}?subject=${encodeURIComponent("Preinscripción · " + data.curso)}&body=${encodeURIComponent(body)}`;
  };

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (honeypot) return; // bot
    const e = validate(data, privacidad);
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    setStatus("sending");
    try {
      await enviarPreinscripcion({
        ...data,
        nombre: data.nombre.trim(),
        email: data.email.trim().toLowerCase(),
        telefono: data.telefono.trim(),
        mensaje: data.mensaje.trim(),
      });
      setStatus("ok");
    } catch (err) {
      if (err instanceof Error && err.message === "NO_BACKEND") {
        window.location.href = mailtoHref();
        setStatus("idle");
        return;
      }
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div className="card">
      <AnimatePresence mode="wait">
        {status === "ok" ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-10 text-center"
            role="status"
          >
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-soft text-green">
              <CircleCheck size={34} />
            </span>
            <h3 className="mt-5 text-2xl font-bold text-ink">¡Solicitud recibida!</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Gracias, {data.nombre.split(" ")[0]}. Te contactaremos en menos de 48 h laborables para confirmar tu plaza.
            </p>
            <button
              className="btn btn-outline mt-6"
              onClick={() => {
                setData(EMPTY);
                setPrivacidad(false);
                setStatus("idle");
              }}
            >
              Enviar otra solicitud
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} noValidate className="space-y-4" exit={{ opacity: 0 }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo" error={errors.nombre} className="sm:col-span-2">
                {(p) => (
                  <input {...p} className="input" autoComplete="name" value={data.nombre} onChange={(e) => set("nombre")(e.target.value)} maxLength={120} />
                )}
              </Field>
              <Field label="Correo electrónico" error={errors.email}>
                {(p) => (
                  <input {...p} className="input" type="email" autoComplete="email" value={data.email} onChange={(e) => set("email")(e.target.value)} maxLength={160} />
                )}
              </Field>
              <Field label="Teléfono (opcional)" error={errors.telefono}>
                {(p) => (
                  <input {...p} className="input" type="tel" autoComplete="tel" inputMode="tel" value={data.telefono} onChange={(e) => set("telefono")(e.target.value)} maxLength={20} />
                )}
              </Field>
              <Field label="Curso" error={errors.curso}>
                {(p) => (
                  <select {...p} className="input" value={data.curso} onChange={(e) => set("curso")(e.target.value)}>
                    <option value="">Selecciona un curso</option>
                    {COURSES.map((c) => (
                      <option key={c.slug} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Sede" error={errors.sede}>
                {(p) => (
                  <select {...p} className="input" value={data.sede} onChange={(e) => set("sede")(e.target.value)}>
                    <option value="">Selecciona tu sede</option>
                    {SEDES.map((s) => (
                      <option key={s.city} value={s.city}>
                        {s.city}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Mensaje (opcional)" className="sm:col-span-2">
                {(p) => (
                  <textarea {...p} className="input min-h-28 resize-y" value={data.mensaje} onChange={(e) => set("mensaje")(e.target.value)} maxLength={1500} placeholder="Cuéntanos tu disponibilidad o cualquier duda" />
                )}
              </Field>
            </div>

            {/* Campo trampa para bots: invisible para personas */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
              aria-hidden="true"
              name="empresa_web"
            />

            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink2">
              <input
                type="checkbox"
                checked={privacidad}
                onChange={(e) => {
                  setPrivacidad(e.target.checked);
                  if (errors.privacidad) setErrors((er) => ({ ...er, privacidad: undefined }));
                }}
                aria-invalid={!!errors.privacidad}
                className="mt-0.5 h-4.5 w-4.5 shrink-0 accent-[var(--red)]"
              />
              <span>
                Acepto que {SITE.name} use mis datos para gestionar esta solicitud, según la{" "}
                <Link to="/privacidad" className="font-semibold text-red underline-offset-2 hover:underline">
                  política de privacidad
                </Link>
                .
              </span>
            </label>
            {errors.privacidad && <p className="text-xs font-semibold text-red">{errors.privacidad}</p>}

            {status === "error" && (
              <p className="rounded-xl border border-red/25 bg-red-soft px-4 py-3 text-sm font-medium text-red" role="alert">
                No hemos podido enviar tu solicitud. Inténtalo de nuevo o{" "}
                <a href={mailtoHref()} className="underline">
                  escríbenos por email
                </a>
                .
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full py-3.5" disabled={status === "sending"}>
              {status === "sending" ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Send size={16} /> Enviar preinscripción
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  error,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: (p: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined })}
      {error && (
        <p id={`${id}-err`} className="mt-1.5 text-xs font-semibold text-red">
          {error}
        </p>
      )}
    </div>
  );
}
