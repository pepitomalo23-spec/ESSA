import { AnimatePresence } from "motion/react";
import { ArrowLeft, Clock, Lock, LoaderCircle, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Breakdown } from "../components/Breakdown";
import { Dialog } from "../components/Dialog";
import { Screen } from "../components/Screen";
import { Shell } from "../components/Shell";
import { StarPicker } from "../components/Stars";
import { api, errorMessage, type FinishResult, type PublicInfo, type StudentQuestion } from "../lib/api";
import { formatClock, syncClock, useCountdown } from "../lib/time";

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
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Información pública (ciudades, sesiones abiertas). Se refresca para el aviso "examen disponible".
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
    setProgress({ current: 0, total: 0 });
    setNotice(message);
    setStage("intro");
  }, []);

  const goQuiz = useCallback(() => setStage("quiz"), []);

  const finished = useCallback((r: FinishResult) => {
    setResult(r);
    setStage(r.status === "left" ? "locked" : "result");
  }, []);

  return (
    <Shell
      ecg={stage === "quiz" ? progress : undefined}
      footer={
        stage === "intro" && (
          <Link to="/personal" className="text-xs text-muted/70 transition hover:text-ink">
            Acceso personal ESSA
          </Link>
        )
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
        {stage === "waiting" && attempt && (
          <Waiting key="waiting" attempt={attempt} onStart={goQuiz} onLeave={reset} />
        )}
        {stage === "quiz" && attempt && (
          <Quiz key="quiz" attempt={attempt} onProgress={setProgress} onFinished={finished} onGone={reset} />
        )}
        {stage === "result" && attempt && result && (
          <Result key="result" attempt={attempt} result={result} info={info} onHome={() => reset()} />
        )}
        {stage === "locked" && <Locked key="locked" onHome={() => reset()} />}
      </AnimatePresence>
    </Shell>
  );
}

// ── 1. Formulario de acceso ───────────────────────────────────────────────
function Intro({
  info,
  notice,
  onJoined,
}: {
  info: PublicInfo | null;
  notice: string;
  onJoined: (s: Saved, running: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const openHere = info?.open.find((o) => o.city === city);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Escribe tu nombre completo.");
    if (!city) return setError("Selecciona tu ciudad o municipio.");
    if (info?.require_email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      return setError("Escribe el email con el que te inscribiste.");
    if (pin.length !== 6) return setError("El código de examen tiene 6 cifras.");
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
    <Screen>
      {!info && (
        <div className="alert alert-info flex items-center gap-2.5 text-xs font-semibold">
          <span className="live-dot bg-navy-mid" />
          Conectando de forma segura con el servidor de ESSA…
        </div>
      )}
      {notice && <div className="alert alert-warn">{notice}</div>}

      <form className="card" onSubmit={submit} noValidate>
        <div className="mb-6 border-b border-line pb-5">
          <h1 className="page-title sm:text-3xl">
            Evaluación <span className="text-red uppercase">{info?.exam_title ?? "Primeros Auxilios"}</span>
          </h1>
          <p className="page-sub mt-2">
            Introduce tus datos y el código PIN de examen que te ha dado tu instructor.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="st-name">
              Tu nombre completo
            </label>
            <input id="st-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </div>

          <div>
            <label className="label" htmlFor="st-city">
              Ciudad o municipio
            </label>
            <select id="st-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">Selecciona tu ciudad</option>
              {info?.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {info?.require_email && (
            <div>
              <label className="label" htmlFor="st-email">
                Email de inscripción
              </label>
              <input
                id="st-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={160}
              />
            </div>
          )}

          <div>
            <label className="label" htmlFor="st-pin">
              Código del examen
            </label>
            <input
              id="st-pin"
              className="input text-center font-display text-2xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="······"
              value={pin}
              maxLength={6}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          {city && (
            <div className={`alert ${openHere ? "alert-ok" : "alert-warn"}`}>
              <div className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
                {openHere && <span className="live-dot bg-green" />}
                {openHere ? `Examen disponible en ${city}` : `No hay exámenes activos en ${city}`}
              </div>
              <p className="mt-1 text-xs opacity-90">
                {!openHere
                  ? "Espera a que tu instructor abra la sesión de examen para esta ciudad."
                  : openHere.status === "running"
                    ? "El examen ya ha empezado. Introduce el PIN para unirte."
                    : "La sala de espera está abierta. El examen comenzará en breve."}
              </p>
            </div>
          )}

          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-cta mt-2 w-full py-4" disabled={busy}>
            {busy ? <LoaderCircle size={18} className="animate-spin" /> : null}
            ACCEDER A LA EVALUACIÓN
          </button>
        </div>
      </form>
    </Screen>
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
        if (!st) return onLeave("La sesión de examen se ha cerrado. Si tienes un nuevo código, vuelve a entrar.");
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
      /* si falla, el instructor lo verá como pendiente y se limpia al cerrar */
    }
    onLeave();
  }

  return (
    <Screen>
      <button className="btn-back" onClick={leave} disabled={leaving}>
        <ArrowLeft size={16} /> Salir de la sala
      </button>
      <div className="card text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 animate-pulse place-items-center rounded-full border border-red/20 bg-red-soft font-display text-sm font-bold text-red">
          ESSA
        </div>
        <h2 className="page-title">
          ¡Hola, <span className="text-red">{attempt.name.split(" ")[0]}</span>!
        </h2>
        <p className="page-sub mt-1">Has entrado en la sala de examen de {attempt.city}.</p>

        <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-bg px-4 py-2 text-xs font-semibold text-ink2">
          <Wifi size={14} className="text-green" /> Conectado en tiempo real
        </div>

        <div className="alert alert-warn mx-auto mt-6 max-w-sm text-xs font-semibold">
          Esperando a que el instructor inicie el examen. No cierres esta ventana: empezará solo.
        </div>
      </div>
    </Screen>
  );
}

// ── 3. Examen ─────────────────────────────────────────────────────────────
function Quiz({
  attempt,
  onProgress,
  onFinished,
  onGone,
}: {
  attempt: Saved;
  onProgress: (p: { current: number; total: number }) => void;
  onFinished: (r: FinishResult) => void;
  onGone: (msg?: string) => void;
}) {
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [endsAt, setEndsAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [exitOpen, setExitOpen] = useState(false);
  const finishing = useRef(false);
  const left = useCountdown(endsAt);

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
      setError("No hemos podido entregar el examen. Comprueba tu conexión; tus respuestas están guardadas.");
    },
    [attempt.token, onFinished],
  );

  // Carga (o recupera) las preguntas asignadas.
  useEffect(() => {
    api
      .startAttempt(attempt.token)
      .then((data) => {
        syncClock(data.now);
        setQuestions(data.questions);
        setEndsAt(data.ends_at);
        const firstOpen = data.questions.findIndex((q) => data.answers[q.id] === undefined);
        if (firstOpen === -1) return finish("done");
        setIdx(firstOpen);
      })
      .catch((e) => onGone(errorMessage(e)));
  }, [attempt.token, finish, onGone]);

  useEffect(() => onProgress({ current: idx, total: questions.length }), [idx, questions.length, onProgress]);

  // Fin del tiempo.
  useEffect(() => {
    if (endsAt && left === 0) finish("timed_out");
  }, [left, endsAt, finish]);

  // Vigila si el instructor cierra la sesión o amplía el tiempo.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const st = await api.attemptState(attempt.token);
        if (!st) return;
        syncClock(st.now);
        if (st.session_status === "closed") finish("timed_out");
        else if (st.ends_at) setEndsAt(st.ends_at);
      } catch {
        /* sin conexión momentánea */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [attempt.token, finish]);

  // Bloqueo si el alumno sale de la pantalla.
  useEffect(() => {
    const onHide = () => {
      if (finishing.current) return;
      setExitOpen(true);
      api.reportExit(attempt.token).catch(() => {});
    };
    const onVisibility = () => document.hidden && onHide();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onHide);
    };
  }, [attempt.token]);

  async function next() {
    if (selected === null) return;
    const q = questions[idx];
    setSaving(true);
    setError("");
    try {
      await api.saveAnswer(attempt.token, q.id, selected);
      setSelected(null);
      if (idx + 1 < questions.length) setIdx(idx + 1);
      else await finish("done");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const q = questions[idx];
  const urgent = left > 0 && left <= 30;

  return (
    <Screen>
      <Dialog
        open={exitOpen}
        title="¿Seguro que quieres salir?"
        confirmLabel="Salir del examen"
        cancelLabel="Continuar examen"
        onConfirm={() => {
          setExitOpen(false);
          finish("left");
        }}
        onCancel={() => setExitOpen(false)}
      >
        Si abandonas o sales de la pantalla del examen, se registrará como incompleto y no podrás volver a entrar.
        Tu instructor verá cuántas veces has salido.
      </Dialog>

      <button className="btn-back" onClick={() => setExitOpen(true)}>
        <ArrowLeft size={16} /> Cancelar examen
      </button>

      {!q ? (
        <div className="card flex items-center justify-center gap-3 py-16 text-sm text-muted">
          <LoaderCircle size={18} className="animate-spin" /> Preparando tus preguntas…
        </div>
      ) : (
        <div className="card">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted">
            <span>
              Pregunta {idx + 1} de {questions.length}
            </span>
            {endsAt && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 tabular-nums ${urgent ? "animate-pulse bg-red-soft text-red" : "bg-bg text-ink2"}`}
                aria-live={urgent ? "assertive" : "off"}
              >
                <Clock size={13} /> {formatClock(left)}
              </span>
            )}
          </div>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-navy transition-all duration-300 dark:bg-navy-mid"
              style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
            />
          </div>

          <p className="mb-6 text-lg leading-relaxed font-bold text-ink" id="q-text">
            {q.question}
          </p>

          <div className="space-y-3" role="radiogroup" aria-labelledby="q-text">
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected === i}
                className="option flex items-center gap-3"
                onClick={() => setSelected(i)}
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                    selected === i ? "border-navy bg-navy text-white dark:border-navy-mid dark:bg-navy-mid" : "border-line text-muted"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}
          </div>

          {error && (
            <p className="alert alert-error mt-5" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary mt-6 w-full" onClick={next} disabled={selected === null || saving}>
            {saving && <LoaderCircle size={17} className="animate-spin" />}
            {idx + 1 === questions.length ? "Finalizar evaluación" : "Siguiente pregunta"}
          </button>
        </div>
      )}
    </Screen>
  );
}

// ── 4. Resultado y valoración ─────────────────────────────────────────────
function Result({
  attempt,
  result,
  info,
  onHome,
}: {
  attempt: Saved;
  result: FinishResult;
  info: PublicInfo | null;
  onHome: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timedOut = result.status === "timed_out";

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
    <Screen>
      <div className="card text-center">
        {timedOut && (
          <>
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-soft text-amber">
              <Clock size={26} />
            </div>
            <h2 className="page-title text-amber">¡Examen finalizado!</h2>
            <p className="page-sub mt-1">
              Se ha acabado el tiempo o el instructor ha cerrado la sesión. Tus respuestas hasta este momento están guardadas.
            </p>
          </>
        )}
        <div className="mt-2 font-display text-6xl font-bold text-ink tabular-nums">
          {result.score}/{result.total}
        </div>
        <p className="mt-1 text-sm font-semibold text-muted">{result.pct}% de aciertos</p>
        <span className={`badge mt-4 px-4 py-1.5 text-sm ${result.pass ? "badge-green" : "badge-red"}`}>
          {result.pass ? "APTO / APROBADO" : "NO APTO / SUSPENSO"}
        </span>

        {result.breakdown && result.breakdown.length > 0 && (
          <div className="mt-7 border-t border-line pt-6 text-left">
            <h3 className="section-title mb-3">{timedOut ? "Respuestas enviadas antes del límite" : "Correcciones detalladas"}</h3>
            <div className="max-h-[26rem] overflow-y-auto pr-1">
              <Breakdown items={result.breakdown} />
            </div>
          </div>
        )}
      </div>

      {!sent ? (
        <div className="card">
          <h2 className="section-title">¿Cómo valoras el curso?</h2>
          <p className="page-sub mt-1 mb-5">Tu opinión nos ayuda a seguir formando a los mejores socorristas.</p>
          <StarPicker value={rating} onChange={setRating} />
          <label className="label mt-6" htmlFor="st-comment">
            Comentario u observaciones (opcional)
          </label>
          <textarea
            id="st-comment"
            className="input"
            value={comment}
            maxLength={1000}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Qué te ha parecido el formador? ¿Qué podríamos mejorar?"
          />
          {error && <p className="alert alert-error mt-4">{error}</p>}
          <button className="btn btn-primary mt-5 w-full" onClick={sendRating} disabled={rating === 0 || busy}>
            Enviar valoración
          </button>
        </div>
      ) : (
        <div className="card text-center">
          {review ? (
            <>
              <h2 className="page-title text-lg">¡Muchísimas gracias!</h2>
              <p className="page-sub mt-2 mb-6">
                Nos alegra que hayas disfrutado de la formación. ¿Nos ayudas con una breve reseña en Google? Solo te costará un minuto.
              </p>
              <a href={info!.google_review_url!} target="_blank" rel="noopener noreferrer" className="btn btn-success w-full">
                Dejar reseña en Google
              </a>
            </>
          ) : (
            <>
              <h2 className="page-title text-lg">Gracias por tu valoración</h2>
              <p className="page-sub mt-2">Tomamos nota de tu comentario para seguir mejorando.</p>
            </>
          )}
        </div>
      )}

      <button className="btn btn-outline w-full" onClick={onHome}>
        Volver a la página de inicio
      </button>
    </Screen>
  );
}

// ── 5. Examen bloqueado ───────────────────────────────────────────────────
function Locked({ onHome }: { onHome: () => void }) {
  return (
    <Screen>
      <div className="card text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-soft text-red">
          <Lock size={26} />
        </div>
        <h2 className="page-title">Examen cerrado por seguridad</h2>
        <p className="page-sub mt-2">
          Has salido de la pantalla durante la evaluación. Para evitar fraudes, el examen ha quedado bloqueado y registrado como
          incompleto.
        </p>
        <p className="mt-3 text-xs text-muted">Habla con tu instructor de ESSA si ha sido un error involuntario.</p>
        <button className="btn btn-outline mt-6 w-full" onClick={onHome}>
          Volver al inicio
        </button>
      </div>
    </Screen>
  );
}
