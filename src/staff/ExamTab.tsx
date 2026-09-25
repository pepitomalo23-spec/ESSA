import { Check, Copy, LoaderCircle, MonitorUp, Play, Plus, Square, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Dialog } from "../components/Dialog";
import { api, errorMessage, type Attempt, type ExamSession, type Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { dayKey, formatClock, syncClock, timeOf, useCountdown } from "../lib/time";
import { joinUrl, Projector } from "./Projector";
import { Loading, Page } from "./Page";
import { useLive } from "./useLive";

export function StatusText({ a }: { a: Pick<Attempt, "status" | "score" | "total"> & { locked?: boolean } }) {
  if (a.status === "in_progress" && a.locked) return <span className="status status-amber font-semibold text-amber">Bloqueado</span>;
  switch (a.status) {
    case "waiting":
      return <span className="status">En sala</span>;
    case "in_progress":
      return <span className="status status-navy">Respondiendo</span>;
    case "done":
      return <span className="status status-green">Entregado</span>;
    case "timed_out":
      return <span className="status status-amber">Sin tiempo</span>;
    case "left":
      return <span className="status status-red">Abandonó</span>;
  }
}

export function ExamTab({ me }: { me: Staff }) {
  const [session, setSession] = useState<ExamSession | null | undefined>(undefined);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [projecting, setProjecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [recent, setRecent] = useState<(ExamSession & { attempts: { count: number }[] })[]>([]);
  const left = useCountdown(session?.status === "running" ? session.ends_at : null);

  const loadSession = useCallback(async () => {
    const res = await supabase.from("exam_sessions").select("*").eq("instructor_id", me.user_id).neq("status", "closed").maybeSingle();
    setSession((res.data as ExamSession | null) ?? null);
  }, [me.user_id]);

  const loadRecent = useCallback(async () => {
    const res = await supabase
      .from("exam_sessions")
      .select("*, attempts(count)")
      .eq("instructor_id", me.user_id)
      .eq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(6);
    if (!res.error) setRecent(res.data as (ExamSession & { attempts: { count: number }[] })[]);
  }, [me.user_id]);

  const loadAttempts = useCallback(async () => {
    if (!session) return setAttempts([]);
    const res = await supabase.from("attempts").select("*").eq("session_id", session.id).order("created_at");
    if (!res.error) setAttempts(res.data as Attempt[]);
  }, [session]);

  useEffect(() => {
    loadSession();
    loadRecent();
    supabase
      .from("cities")
      .select("name")
      .order("name")
      .then((r) => setCities((r.data ?? []).map((c: { name: string }) => c.name)));
    supabase
      .from("settings")
      .select("exam_minutes")
      .eq("id", 1)
      .maybeSingle()
      .then((r) => r.data && setMinutes(r.data.exam_minutes));
    api
      .publicInfo()
      .then((i) => syncClock(i.now))
      .catch(() => {});
  }, [loadSession, loadRecent]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  useLive("attempts", session ? `session_id=eq.${session.id}` : null, loadAttempts, 5000);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await loadSession();
      loadRecent();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function unlock(a: Attempt) {
    setUnlocking(a.id);
    setError("");
    try {
      await api.unlockAttempt(a.id);
      setAttempts((list) => list.map((x) => (x.id === a.id ? { ...x, locked: false } : x)));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setUnlocking(null);
    }
  }

  if (session === undefined) return <Loading />;

  const count = (s: Attempt["status"]) => attempts.filter((a) => a.status === s).length;

  // ── Sin examen abierto ──
  if (!session)
    return (
      <Page title="Examen en sala" description="Abre la sala para una ciudad. Se generará un código de 6 cifras para que los alumnos entren desde su móvil.">
        {error && <p className="note note-error mb-5">{error}</p>}
        <div className="sheet max-w-2xl p-6">
          <p className="field-label" id="city-label">
            Ciudad o municipio
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-labelledby="city-label">
            {cities.map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={city === c}
                onClick={() => setCity(c)}
                className={`cursor-pointer rounded-md border px-3 py-2.5 text-left text-[15px] font-medium transition-colors ${
                  city === c ? "border-navy bg-navy-soft text-navy shadow-[inset_0_0_0_1px_var(--navy)]" : "border-line-strong text-ink hover:bg-sunken"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
            <p className="text-sm text-muted">{city ? `Se abrirá la sala de ${city}.` : "Elige una ciudad para continuar."}</p>
            <button className="btn btn-accent" disabled={!city || busy} onClick={() => run(() => api.openSession(city))}>
              {busy && <LoaderCircle size={16} className="animate-spin" />} Abrir sala
            </button>
          </div>
        </div>

        {recent.length > 0 && (
          <section className="mt-10 max-w-2xl">
            <h2 className="display mb-3 text-2xl text-ink">Tus últimos exámenes</h2>
            <div className="sheet overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ciudad</th>
                    <th className="num">Duración</th>
                    <th className="num">Alumnos</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td className="tnum text-ink">
                        {dayKey(r.created_at)} <span className="text-muted">· {timeOf(r.created_at)}</span>
                      </td>
                      <td>{r.city}</td>
                      <td className="num text-muted">{r.duration_minutes ? `${r.duration_minutes} min` : "No empezó"}</td>
                      <td className="num font-medium">{r.attempts?.[0]?.count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm text-muted">Los resultados completos están en Historial.</p>
          </section>
        )}
      </Page>
    );

  const running = session.status === "running";
  const over = running && left === 0;

  return (
    <Page
      title={`Examen en sala · ${session.city}`}
      description={
        running
          ? "El examen está en marcha. La tabla se actualiza sola."
          : "La sala está abierta. Comparte el código con los alumnos y pulsa «Iniciar examen» cuando estén todos."
      }
    >
      {error && <p className="note note-error mb-5">{error}</p>}

      {/* Franja de control */}
      <div className="sheet grid overflow-hidden sm:grid-cols-[auto_1fr_auto] sm:divide-x sm:divide-line">
        <div className="border-b border-line p-5 sm:border-b-0 sm:px-7">
          <p className="eyebrow">Código de acceso</p>
          <p className="display tnum mt-1 text-6xl tracking-[0.06em] text-ink">
            {session.pin.slice(0, 3)}
            <span className="text-line-strong"> </span>
            {session.pin.slice(3)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            <button className="btn btn-secondary btn-sm" onClick={() => setProjecting(true)}>
              <MonitorUp size={15} /> Proyectar
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(joinUrl(session)).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }, () => {});
              }}
            >
              {copied ? <Check size={15} className="text-green" /> : <Copy size={15} />} {copied ? "Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-line border-b border-line sm:border-b-0">
          <div className="p-5">
            <p className="eyebrow">Estado</p>
            <p className={`display mt-1 text-3xl ${over ? "text-red" : running ? "text-green" : "text-ink"}`}>
              {over ? "Tiempo agotado" : running ? "En curso" : "Sala de espera"}
            </p>
            <p className="tnum mt-0.5 text-sm text-muted">
              {attempts.length} {attempts.length === 1 ? "alumno" : "alumnos"}
            </p>
          </div>
          <div className="p-5">
            <p className="eyebrow">{running ? "Tiempo restante" : "Duración"}</p>
            {running ? (
              <p className={`display tnum mt-1 text-4xl ${left <= 60 ? "text-red" : "text-ink"}`}>{formatClock(left)}</p>
            ) : (
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id="ex-min"
                  aria-label="Duración en minutos"
                  className="input tnum w-20 min-h-10 text-center text-lg font-semibold"
                  type="number"
                  min={1}
                  max={180}
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                />
                <span className="text-[15px] text-ink2">min</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-center gap-2 p-5 sm:min-w-56">
          {running ? (
            <>
              <button className="btn btn-secondary" disabled={busy} onClick={() => run(() => api.extendSession(session.id, 5))}>
                <Plus size={16} /> Añadir 5 min
              </button>
              <button className="btn btn-accent" disabled={busy} onClick={() => setConfirmClose(true)}>
                <Square size={14} fill="currentColor" /> Terminar examen
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-accent" disabled={busy} onClick={() => run(() => api.startSession(session.id, minutes))}>
                <Play size={15} fill="currentColor" /> Iniciar examen
              </button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => setConfirmClose(true)}>
                Cerrar sala
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alumnos */}
      {attempts.some((a) => a.locked && a.status === "in_progress") && (
        <p className="note note-warn mt-6 font-medium" role="status">
          {(() => {
            const n = attempts.filter((a) => a.locked && a.status === "in_progress").length;
            return n === 1
              ? "Un alumno ha salido de la pantalla y espera que le dejes continuar."
              : `${n} alumnos han salido de la pantalla y esperan que les dejes continuar.`;
          })()}
        </p>
      )}

      <div className="mt-8 mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display text-2xl text-ink">Alumnos</h2>
        <p className="tnum text-sm text-ink2">
          {count("waiting")} en sala · {count("in_progress")} respondiendo · {count("done") + count("timed_out")} entregados · {count("left")} abandonos
        </p>
      </div>
      <div className="sheet overflow-x-auto">
        {attempts.length === 0 ? (
          <p className="px-6 py-12 text-center text-[15px] text-muted">Todavía no ha entrado nadie. Los alumnos aparecerán aquí en cuanto introduzcan el código.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Estado</th>
                <th>Progreso</th>
                <th className="num">Salidas</th>
                <th className="num">Nota</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => {
                const total = a.question_ids?.length ?? 0;
                const answered = Object.keys(a.answers ?? {}).length;
                return (
                  <tr key={a.id} className={a.locked && a.status === "in_progress" ? "bg-amber-soft/60" : ""}>
                    <td className="font-medium text-ink">{a.name}</td>
                    <td>
                      <StatusText a={a} />
                    </td>
                    <td className="min-w-40">
                      {total > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                            <div className="h-full bg-navy" style={{ width: `${(answered / total) * 100}%` }} />
                          </div>
                          <span className="tnum text-sm text-muted">
                            {answered}/{total}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted">—</span>
                      )}
                    </td>
                    <td className={`num ${a.exits > 0 ? "font-semibold text-amber" : "text-muted"}`}>{a.exits}</td>
                    <td className="num font-semibold">
                      {a.score != null && a.status !== "left" ? (
                        <span className={a.pass ? "text-green" : "text-red"}>
                          {a.score}/{a.total}
                        </span>
                      ) : (
                        <span className="font-normal text-muted">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      {a.locked && a.status === "in_progress" && (
                        <button className="btn btn-primary btn-sm" disabled={unlocking === a.id} onClick={() => unlock(a)}>
                          {unlocking === a.id ? <LoaderCircle size={15} className="animate-spin" /> : <Unlock size={15} />} Dejar continuar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {projecting && <Projector session={session} waiting={count("waiting")} onClose={() => setProjecting(false)} />}

      <Dialog
        open={confirmClose}
        title={running ? "¿Terminar el examen?" : "¿Cerrar la sala?"}
        confirmLabel={running ? "Terminar examen" : "Cerrar sala"}
        cancelLabel="Volver"
        busy={busy}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          run(() => api.closeSession(session.id));
        }}
      >
        {running
          ? "Quien siga respondiendo entregará con lo que lleve contestado. El código dejará de funcionar."
          : "Los alumnos de la sala volverán al inicio y el código dejará de funcionar."}
      </Dialog>
    </Page>
  );
}
