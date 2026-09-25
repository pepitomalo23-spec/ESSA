import { AnimatePresence } from "motion/react";
import { ArrowRight, LoaderCircle, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Breakdown } from "../components/Breakdown";
import { Dialog } from "../components/Dialog";
import { EcgProgress } from "../components/Ecg";
import { GoogleReview } from "../components/GoogleReview";
import { PinInput } from "../components/PinInput";
import { Screen } from "../components/Screen";
import { Shell } from "../components/Shell";
import { StarPicker } from "../components/Stars";
import { api, ApiError, errorMessage, type FinishResult, type PublicInfo, type StudentQuestion } from "../lib/api";
import { formatClock, syncClock, useCountdown } from "../lib/time";
import { scrollToTop } from "../lib/scroll";
import { useTitle } from "../lib/useTitle";

type Stage = "intro" | "waiting" | "quiz" | "result" | "locked";
type Saved = { token: string; name: string; city: string };

const STORE = "essa-attempt";
const loadSaved = (): Saved | null => {
  try {
    const raw = sessionStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};
const save = (s: Saved | null) => {
  try {
    if (s) sessionStorage.setItem(STORE, JSON.stringify(s));
    else sessionStorage.removeItem(STORE);
  } catch {
    /* almacenamiento no disponible */
  }
};

export default function StudentApp() {
  const [stage, setStage] = useState<Stage>("intro");
  const [info, setInfo] = useState<PublicInfo | null>(null);
  const [attempt, setAttempt] = useState<Saved | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [notice, setNotice] = useState("");

  // Información pública (ciudades, sesiones abiertas). Se refresca para el aviso de sala abierta.
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .publicInfo()
        .then((i) => alive && setInfo(i))
        .catch(() => {});
    load();
    const id = setInterval(load, 6000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // Si se recarga la página, recupera el examen en curso de esta pestaña.
  useEffect(() => {
    const saved = loadSaved();
    if (!saved) return;
    api
      .attemptState(saved.token)
      .then(async (st) => {
        if (!st) return save(null);
        setAttempt(saved);
        if (st.attempt_status === "waiting") setStage(st.session_status === "running" ? "quiz" : "waiting");
        else if (st.attempt_status === "in_progress") setStage("quiz");
        else if (st.attempt_status === "left") setStage("locked");
        else {
          setResult(await api.finishAttempt(saved.token, "done"));
          setStage("result");
        }
      })
      .catch(() => {});
  }, []);

  const reset = useCallback((message = "") => {
    save(null);
    setAttempt(null);
    setResult(null);
    setNotice(message);
    setStage("intro");
  }, []);

  const goQuiz = useCallback(() => setStage("quiz"), []);

  // Cada pantalla empieza arriba (tras entregar, el botón quedaba al final de la página).
  useEffect(() => {
    scrollToTop();
  }, [stage]);

  useTitle({ intro: "Acceso al examen", waiting: "Sala de espera", quiz: "Examen en curso", result: "Resultado", locked: "Examen abandonado" }[stage]);

  const finished = useCallback((r: FinishResult) => {
    setResult(r);
    setStage(r.status === "left" ? "locked" : "result");
  }, []);

  return (
    <Shell
      hero={stage === "intro" ? <Welcome info={info} /> : undefined}
      context={attempt && stage !== "intro" ? <span className="hidden max-w-48 truncate text-sm text-muted sm:inline">{attempt.name}</span> : null}
      footerLink={
        stage === "intro" ? (
          <Link to="/personal" className="inline-flex items-center gap-1 font-medium text-ink2 hover:text-ink">
            Acceso del personal <ArrowRight size={14} />
          </Link>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <Intro
            key="intro"
            info={info}
            notice={notice}
            onJoined={(saved, running) => {
              save(saved);
              setAttempt(saved);
              setNotice("");
              setStage(running ? "quiz" : "waiting");
            }}
          />
        )}
        {stage === "waiting" && attempt && <Waiting key="waiting" attempt={attempt} onStart={goQuiz} onLeave={reset} />}
        {stage === "quiz" && attempt && <Quiz key="quiz" attempt={attempt} onFinished={finished} onGone={reset} />}
        {stage === "result" && attempt && result && <Result key="result" attempt={attempt} result={result} info={info} onHome={() => reset()} />}
        {stage === "locked" && <Locked key="locked" onHome={() => reset()} />}
      </AnimatePresence>
    </Shell>
  );
}

function PageHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="mb-7">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display mt-2 text-[40px] text-ink sm:text-5xl">{title}</h1>
      {children && <p className="mt-3 max-w-[52ch] text-[17px] leading-relaxed text-ink2">{children}</p>}
    </div>
  );
}

// ── 1. Acceso ─────────────────────────────────────────────────────────────
function Intro({ info, notice, onJoined }: { info: PublicInfo | null; notice: string; onJoined: (s: Saved, running: boolean) => void }) {
  // El QR que proyecta el instructor trae la ciudad y el código: el alumno solo escribe su nombre.
  const [prefill] = useState(() => {
    const q = new URLSearchParams(window.location.search);
    const code = (q.get("codigo") ?? "").replace(/\D/g, "").slice(0, 6);
    if (q.has("codigo") || q.has("ciudad")) window.history.replaceState(null, "", window.location.pathname);
    return { city: q.get("ciudad") ?? "", pin: code };
  });
  const [name, setName] = useState("");
  const [city, setCity] = useState(prefill.city);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(prefill.pin);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (prefill.pin) nameRef.current?.focus();
  }, [prefill.pin]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openHere = info?.open.find((o) => o.city === city);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Escribe tu nombre y apellidos.");
    if (!city) return setError("Elige tu ciudad o municipio.");
    if (info?.require_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Escribe el email con el que te inscribiste.");
    if (pin.length !== 6) return setError("El código tiene 6 cifras. Pídeselo a tu instructor.");
    setBusy(true);
    try {
      const joined = await api.joinExam(city, pin, name.trim(), email.trim() || undefined);
      const state = await api.attemptState(joined.token);
      onJoined({ token: joined.token, name: name.trim(), city: joined.city }, state?.session_status === "running");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen className="relative z-[1] -mt-24 sm:-mt-28">

      <form className="sheet space-y-5 p-5 shadow-[0_24px_48px_-28px_rgb(11_27_47/0.45)] sm:p-7" onSubmit={submit} noValidate>
        <div>
          <h2 className="display text-[28px] text-ink">Acceso al examen</h2>
          <p className="mt-1 text-[15px] text-ink2">Escribe tu nombre, elige tu ciudad y el código que te dé tu instructor.</p>
        </div>
        {notice && <p className="note note-warn">{notice}</p>}
        {prefill.pin && !notice && (
          <p className="note note-info">
            Código y ciudad ya puestos{prefill.city ? ` (${prefill.city})` : ""}. Solo falta tu nombre.
          </p>
        )}

        <div>
          <label className="field-label" htmlFor="st-name">
            Nombre y apellidos
          </label>
          <input id="st-name" ref={nameRef} className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>

        <div>
          <label className="field-label" htmlFor="st-city">
            Ciudad o municipio del curso
          </label>
          <select id="st-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} disabled={!info}>
            <option value="">{info ? "Elige una opción" : "Cargando…"}</option>
            {info?.cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {city && (
            <p className={`status mt-2.5 text-[14px] ${openHere ? "status-green" : ""}`}>
              {!openHere
                ? `Ahora mismo no hay ningún examen abierto en ${city}.`
                : openHere.status === "running"
                  ? `Examen en curso en ${city}. Aún puedes entrar.`
                  : `Sala de espera abierta en ${city}.`}
            </p>
          )}
        </div>

        {info?.require_email && (
          <div>
            <label className="field-label" htmlFor="st-email">
              Email de inscripción
            </label>
            <input id="st-email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
            <p className="field-help">Solo pueden entrar los alumnos inscritos.</p>
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="st-pin">
            Código del examen
          </label>
          <PinInput id="st-pin" value={pin} onChange={setPin} />
        </div>

        {error && (
          <p className="note note-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy && <LoaderCircle size={18} className="animate-spin" />}
          Entrar al examen
        </button>
      </form>

      <section className="mt-12" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="eyebrow mb-4">
          Cómo funciona
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3 sm:gap-5">
          {[
            ["Entra con tu código", "Tu instructor te dará un código de 6 cifras, o un QR para entrar directamente."],
            ["Espera en la sala", "El examen empieza a la vez para todos, en esta misma pantalla."],
            ["Responde con calma", "Cada respuesta se guarda al momento. No cambies de aplicación: el examen se pausaría."],
          ].map(([title, text], i) => (
            <li key={title} className="border-t-2 border-navy pt-3">
              <p className="display tnum text-lg text-red">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-0.5 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-ink2">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </Screen>
  );
}

// Banda de bienvenida del acceso: saludo, fecha y el tono tranquilo que necesita alguien que va a examinarse.
function Welcome({ info }: { info: PublicInfo | null }) {
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  return (
    <section className="relative shrink-0 overflow-hidden bg-brand-deep text-white">
      <svg className="pointer-events-none absolute inset-x-0 bottom-10 h-16 w-full opacity-25" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0,30 L360,30 L372,30 L380,10 L390,52 L400,30 L412,30 L420,22 L428,30 L600,30" fill="none" stroke="#ef5b52" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="relative mx-auto max-w-[640px] px-4 pt-10 pb-32 sm:pt-14 sm:pb-36">
        <p className="eyebrow text-white/60 first-letter:uppercase">{today}</p>
        <h1 className="display mt-3 text-[44px] leading-[0.98] sm:text-6xl">
          Te damos la bienvenida
          <br />
          <span className="text-white/70">a tu evaluación.</span>
        </h1>
        <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-white/80">
          Hoy toca demostrar lo aprendido en el curso de <strong className="font-semibold text-white">{info?.exam_title ?? "Primeros Auxilios"}</strong>. Lee cada
          pregunta con calma: lo has practicado.
        </p>
      </div>
    </section>
  );
}

// ── 2. Sala de espera ─────────────────────────────────────────────────────
function Waiting({ attempt, onStart, onLeave }: { attempt: Saved; onStart: () => void; onLeave: (msg?: string) => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const st = await api.attemptState(attempt.token);
        if (!alive) return;
        if (!st) return onLeave("La sesión de examen se ha cerrado. Si tienes un código nuevo, vuelve a entrar.");
        syncClock(st.now);
        if (st.session_status === "running") onStart();
        if (st.session_status === "closed") onLeave("El instructor ha cerrado la sesión de examen.");
      } catch {
        /* se reintenta en el siguiente ciclo */
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [attempt.token, onStart, onLeave]);

  async function leave() {
    setLeaving(true);
    try {
      await api.finishAttempt(attempt.token, "left");
    } catch {
      /* se limpia al cerrar la sesión */
    }
    onLeave();
  }

  return (
    <Screen>
      <PageHead eyebrow={`Sala de espera · ${attempt.city}`} title={`Hola, ${attempt.name.split(" ")[0]}. Ya estás dentro.`}>
        El examen empezará solo en esta pantalla cuando el instructor lo inicie.
      </PageHead>

      <div className="sheet overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-sunken px-5 py-3.5 sm:px-7">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-sm bg-green opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-sm bg-green" />
          </span>
          <span className="text-[15px] font-medium text-ink">Conectado · esperando al instructor</span>
        </div>
        <div className="p-5 sm:p-7">
          <h2 className="eyebrow mb-3">Antes de empezar</h2>
          <ol className="space-y-3 text-[16px] text-ink2">
            {[
              "Silencia el móvil y cierra otras aplicaciones.",
              "Durante el examen no cambies de pantalla ni de aplicación: si sales, el examen puede quedar bloqueado y tu instructor lo verá.",
              "Cada respuesta se guarda al pulsar «Siguiente». Si se corta la conexión, vuelve a abrir esta página.",
            ].map((t, i) => (
              <li key={i} className="grid grid-cols-[24px_1fr] gap-2">
                <span className="display tnum text-lg leading-6 text-red">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <button className="btn btn-ghost mt-5" onClick={leave} disabled={leaving}>
        Salir de la sala
      </button>
    </Screen>
  );
}

// ── 3. Examen ─────────────────────────────────────────────────────────────
function Quiz({ attempt, onFinished, onGone }: { attempt: Saved; onFinished: (r: FinishResult) => void; onGone: (msg?: string) => void }) {
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const [locked, setLockedState] = useState(false);
  const lockedRef = useRef(false);
  const reporting = useRef(false);
  const finishing = useRef(false);
  const left = useCountdown(endsAt);

  const setLocked = useCallback((v: boolean) => {
    lockedRef.current = v;
    setLockedState(v);
    if (v) setSelected(null);
  }, []);

  const finish = useCallback(
    async (reason: "done" | "left" | "timed_out") => {
      if (finishing.current) return;
      finishing.current = true;
      for (let i = 0; i < 3; i++) {
        try {
          return onFinished(await api.finishAttempt(attempt.token, reason));
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      finishing.current = false;
      setError("No hemos podido entregar el examen. Comprueba tu conexión: tus respuestas están guardadas.");
    },
    [attempt.token, onFinished],
  );

  useEffect(() => {
    api
      .startAttempt(attempt.token)
      .then((data) => {
        syncClock(data.now);
        setQuestions(data.questions);
        setEndsAt(data.ends_at);
        setLocked(!!data.locked);
        const firstOpen = data.questions.findIndex((q) => data.answers[q.id] === undefined);
        if (firstOpen === -1) return finish("done");
        setIdx(firstOpen);
      })
      .catch((e) => onGone(errorMessage(e)));
  }, [attempt.token, finish, onGone, setLocked]);

  useEffect(() => {
    if (endsAt && left === 0) finish("timed_out");
  }, [left, endsAt, finish]);

  // Cierre de la sesión, tiempo ampliado o desbloqueo por parte del instructor.
  useEffect(() => {
    const id = setInterval(
      async () => {
        try {
          const st = await api.attemptState(attempt.token);
          if (!st) return;
          syncClock(st.now);
          if (st.session_status === "closed") return finish("timed_out");
          if (st.ends_at) setEndsAt(st.ends_at);
          // Mientras el aviso de salida no ha llegado al servidor, no nos fiamos de un "no bloqueado".
          if (!reporting.current) setLocked(!!st.locked);
        } catch {
          /* sin conexión momentánea */
        }
      },
      locked ? 2000 : 4000,
    );
    return () => clearInterval(id);
  }, [attempt.token, finish, locked, setLocked]);

  // Salir de la pantalla bloquea el examen hasta que el instructor deje continuar.
  // El navegador avisa dos veces de la misma salida (pérdida de foco y página oculta): solo cuenta la primera.
  useEffect(() => {
    const onHide = async () => {
      if (finishing.current || lockedRef.current) return;
      setLocked(true);
      setExitOpen(false);
      reporting.current = true;
      for (let i = 0; i < 20; i++) {
        try {
          await api.reportExit(attempt.token);
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      reporting.current = false;
    };
    const onVisibility = () => document.hidden && onHide();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onHide);
    };
  }, [attempt.token, setLocked]);

  const next = useCallback(async () => {
    if (selected === null || saving) return;
    const q = questions[idx];
    setSaving(true);
    setError("");
    try {
      await api.saveAnswer(attempt.token, q.id, selected);
      setSelected(null);
      if (idx + 1 < questions.length) setIdx(idx + 1);
      else await finish("done");
    } catch (e) {
      if (e instanceof ApiError && e.code === "BLOQUEADO") setLocked(true);
      else setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [selected, saving, questions, idx, attempt.token, finish, setLocked]);

  // Teclado: A–F o 1–6 para elegir, Intro para continuar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exitOpen || lockedRef.current || !questions[idx]) return;
      const k = e.key.toLowerCase();
      const n = "abcdef".indexOf(k) !== -1 ? "abcdef".indexOf(k) : "123456".indexOf(k);
      if (n !== -1 && n < questions[idx].options.length) setSelected(n);
      if (e.key === "Enter") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [questions, idx, next, exitOpen]);

  const q = questions[idx];
  const tone = left <= 30 ? "text-red" : left <= 60 ? "text-amber" : "text-ink";
  const isLast = idx + 1 === questions.length;

  return (
    <Screen>
      <Dialog
        open={exitOpen}
        title="¿Abandonar el examen?"
        confirmLabel="Abandonar y entregar"
        cancelLabel="Seguir con el examen"
        onConfirm={() => {
          setExitOpen(false);
          finish("left");
        }}
        onCancel={() => setExitOpen(false)}
      >
        Se entregará como incompleto, con lo que hayas respondido hasta ahora, y no podrás volver a entrar.
      </Dialog>

      {!q ? (
        <div className="flex items-center gap-3 py-24 text-muted">
          <LoaderCircle size={18} className="animate-spin" /> Preparando tus preguntas…
        </div>
      ) : (
        <>
          {/* Fijo arriba: número de pregunta, tiempo y progreso */}
          <div className="sticky top-0 z-10 -mx-4 -mt-8 mb-6 border-b border-line bg-bg/95 px-4 pt-4 pb-2 backdrop-blur sm:-mt-12 sm:pt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Pregunta</p>
                <p className="display tnum text-4xl text-ink">
                  {String(idx + 1).padStart(2, "0")}
                  <span className="text-2xl text-muted"> / {String(questions.length).padStart(2, "0")}</span>
                </p>
              </div>
              {endsAt && (
                <div className="text-right" aria-live={left <= 30 ? "assertive" : "off"}>
                  <p className="eyebrow">Tiempo</p>
                  <p className={`display tnum text-4xl ${tone}`}>{formatClock(left)}</p>
                </div>
              )}
            </div>

            <div className="mt-2">
              <EcgProgress current={idx} total={questions.length} />
            </div>
          </div>

          {locked ? (
            <div className="sheet overflow-hidden" role="alert">
              <div className="flex items-center gap-3 border-b border-amber/30 bg-amber-soft px-5 py-3.5 sm:px-7">
                <Lock size={17} className="shrink-0 text-amber" />
                <span className="text-[15px] font-semibold text-amber">Examen en pausa</span>
              </div>
              <div className="p-5 sm:p-7">
                <h1 className="display text-3xl text-ink">Has salido de la pantalla del examen</h1>
                <p className="mt-2 text-[16px] leading-relaxed text-ink2">
                  Para seguir, avisa a tu instructor: tiene que dejarte continuar desde su panel. Tus respuestas están guardadas y el tiempo sigue corriendo.
                </p>
                <p className="mt-5 flex items-center gap-2.5 text-[15px] font-medium text-ink">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-sm bg-amber opacity-40" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-sm bg-amber" />
                  </span>
                  Esperando al instructor…
                </p>
              </div>
            </div>
          ) : (
          <div className="sheet px-5 pt-5 sm:px-7 sm:pt-7">
            <h1 className="text-[21px] leading-snug font-semibold text-ink sm:text-2xl" id="q-text">
              {q.question}
            </h1>

            <div className="mt-6 space-y-2.5" role="radiogroup" aria-labelledby="q-text">
              {q.options.map((opt, i) => {
                const on = selected === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setSelected(i)}
                    className={`flex w-full cursor-pointer items-start gap-3.5 rounded-md border px-4 py-3.5 text-left text-[17px] transition-colors ${
                      on ? "border-navy bg-navy-soft text-ink shadow-[inset_0_0_0_1px_var(--navy)]" : "border-line-strong bg-surface text-ink hover:border-muted hover:bg-sunken"
                    }`}
                  >
                    <span
                      className={`display grid h-7 w-7 shrink-0 place-items-center rounded text-base ${on ? "bg-navy text-on-navy" : "border border-line-strong text-muted"}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>

            {error && (
              <p className="note note-error mt-5" role="alert">
                {error}
              </p>
            )}

            {/* Fijo abajo: el botón para seguir siempre a mano */}
            <div className="sticky bottom-0 -mx-5 mt-7 flex items-center justify-between gap-4 rounded-b-lg border-t border-line bg-surface px-5 py-4 sm:-mx-7 sm:px-7 sm:py-5">
              <p className="hidden text-sm text-muted sm:block">
                Teclas <kbd className="tag">A</kbd>–<kbd className="tag">{String.fromCharCode(64 + q.options.length)}</kbd> para elegir,{" "}
                <kbd className="tag">Intro</kbd> para seguir
              </p>
              <button className={`btn btn-primary btn-lg w-full sm:w-auto sm:min-w-52`} onClick={next} disabled={selected === null || saving}>
                {saving && <LoaderCircle size={17} className="animate-spin" />}
                {isLast ? "Entregar examen" : "Siguiente"}
                {!isLast && !saving && <ArrowRight size={17} />}
              </button>
            </div>
          </div>
          )}

          <button className="btn btn-ghost mt-4 text-muted" onClick={() => setExitOpen(true)}>
            Abandonar el examen
          </button>
        </>
      )}
    </Screen>
  );
}

// ── 4. Resultado y valoración ─────────────────────────────────────────────
function Result({ attempt, result, info, onHome }: { attempt: Saved; result: FinishResult; info: PublicInfo | null; onHome: () => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const timedOut = result.status === "timed_out";
  const items = result.breakdown ?? [];
  const failed = items.filter((i) => !i.ok).length;

  async function sendRating() {
    setBusy(true);
    setError("");
    try {
      await api.rateAttempt(attempt.token, rating, comment);
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const review = info?.google_review_url && rating >= (info?.review_threshold ?? 4);

  return (
    <Screen className="space-y-5">
      <div>
        <p className="eyebrow">Resultado · {attempt.city}</p>
        <h1 className="display mt-2 text-[40px] text-ink sm:text-5xl">{timedOut ? "Tiempo agotado" : "Examen entregado"}</h1>
      </div>

      {timedOut && <p className="note note-warn">Se acabó el tiempo o el instructor cerró la sesión. Se han corregido las respuestas que diste hasta ese momento.</p>}

      <div className="sheet grid grid-cols-2 divide-x divide-line">
        <div className="p-5 sm:p-7">
          <p className="eyebrow">Aciertos</p>
          <p className="display tnum mt-1 text-6xl text-ink sm:text-7xl">
            {result.score}
            <span className="text-3xl text-muted sm:text-4xl">/{result.total}</span>
          </p>
          <p className="tnum mt-1 text-[15px] text-muted">{result.pct} % de aciertos</p>
        </div>
        <div className="p-5 sm:p-7">
          <p className="eyebrow">Calificación</p>
          <p className={`display mt-1 text-5xl sm:text-6xl ${result.pass ? "text-green" : "text-red"}`}>{result.pass ? "APTO" : "NO APTO"}</p>
          <p className="mt-1 text-[15px] text-muted">{result.pass ? "Has superado la evaluación." : "No has alcanzado la nota mínima."}</p>
        </div>
      </div>

      {!sent ? (
        <div className="sheet p-5 sm:p-7">
          <h2 className="display text-2xl text-ink">¿Qué te ha parecido el curso?</h2>
          <p className="mt-1 text-[15px] text-ink2">Tu valoración llega a la escuela y nos ayuda a mejorar cada convocatoria.</p>
          <div className="mt-5">
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <label className="field-label mt-5" htmlFor="st-comment">
            Comentario <span className="font-normal text-muted">(opcional)</span>
          </label>
          <textarea
            id="st-comment"
            className="input"
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Sobre el formador, las prácticas, el material…"
          />
          {error && <p className="note note-error mt-4">{error}</p>}
          <button className="btn btn-primary mt-5" onClick={sendRating} disabled={rating === 0 || busy}>
            Enviar valoración
          </button>
        </div>
      ) : (
        <div className="sheet p-5 sm:p-7">
          {review ? (
            <GoogleReview url={info!.google_review_url!} comment={comment} rating={rating} />
          ) : (
            <>
              <h2 className="display text-2xl text-ink">Gracias por tu valoración</h2>
              <p className="mt-1 text-[15px] text-ink2">Tomamos nota de tus comentarios para la próxima convocatoria.</p>
            </>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div className="sheet p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-2xl text-ink">Corrección</h2>
            {failed > 0 && failed < items.length && (
              <div className="inline-flex rounded-md border border-line-strong p-0.5 text-sm font-semibold" role="group" aria-label="Filtrar corrección">
                {[
                  [false, `Todas (${items.length})`],
                  [true, `Fallos (${failed})`],
                ].map(([v, label]) => (
                  <button
                    key={String(v)}
                    aria-pressed={onlyFailed === v}
                    onClick={() => setOnlyFailed(v as boolean)}
                    className={`cursor-pointer rounded px-3 py-1.5 ${onlyFailed === v ? "bg-navy text-on-navy" : "text-ink2 hover:text-ink"}`}
                  >
                    {label as string}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Breakdown items={onlyFailed ? items.filter((i) => !i.ok) : items} numbered={!onlyFailed} />
        </div>
      )}

      <button className="btn btn-secondary" onClick={onHome}>
        Volver al inicio
      </button>
    </Screen>
  );
}

// ── 5. Examen bloqueado ───────────────────────────────────────────────────
function Locked({ onHome }: { onHome: () => void }) {
  return (
    <Screen>
      <PageHead eyebrow="Examen entregado incompleto" title="Has abandonado el examen">
        Se ha entregado con las respuestas que diste hasta ese momento.
      </PageHead>
      <div className="sheet p-5 sm:p-7">
        <p className="text-[16px] text-ink2">Si ha sido un error, habla con tu instructor: puede ver el registro y decidir cómo seguir.</p>
        <button className="btn btn-secondary mt-5" onClick={onHome}>
          Volver al inicio
        </button>
      </div>
    </Screen>
  );
}
