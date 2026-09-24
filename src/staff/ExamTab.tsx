import { LoaderCircle, Play, Plus, Power, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Dialog } from "../components/Dialog";
import { Screen } from "../components/Screen";
import { api, errorMessage, type Attempt, type ExamSession, type Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { formatClock, syncClock, useCountdown } from "../lib/time";
import { useLive } from "./useLive";

export function StatusBadge({ a }: { a: Pick<Attempt, "status" | "score" | "total"> }) {
  switch (a.status) {
    case "waiting":
      return <span className="badge badge-amber">Esperando en sala</span>;
    case "in_progress":
      return <span className="badge badge-navy">En examen</span>;
    case "done":
      return <span className="badge badge-green">Terminó ({a.score}/{a.total})</span>;
    case "timed_out":
      return <span className="badge badge-amber">Sin tiempo ({a.score}/{a.total})</span>;
    case "left":
      return <span className="badge badge-red">Abandonó</span>;
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
  const left = useCountdown(session?.status === "running" ? session.ends_at : null);

  const loadSession = useCallback(async () => {
    const res = await supabase
      .from("exam_sessions")
      .select("*")
      .eq("instructor_id", me.user_id)
      .neq("status", "closed")
      .maybeSingle();
    setSession((res.data as ExamSession | null) ?? null);
  }, [me.user_id]);

  const loadAttempts = useCallback(async () => {
    if (!session) return setAttempts([]);
    const res = await supabase.from("attempts").select("*").eq("session_id", session.id).order("created_at");
    if (!res.error) setAttempts(res.data as Attempt[]);
  }, [session]);

  useEffect(() => {
    loadSession();
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
    // Sincroniza el reloj con el servidor para que la cuenta atrás coincida con la de los alumnos.
    api
      .publicInfo()
      .then((i) => syncClock(i.now))
      .catch(() => {});
  }, [loadSession]);

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
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const waiting = attempts.filter((a) => a.status === "waiting");

  if (session === undefined)
    return (
      <div className="flex justify-center py-16 text-muted">
        <LoaderCircle className="animate-spin" />
      </div>
    );

  return (
    <Screen>
      {error && <p className="alert alert-error">{error}</p>}

      {!session ? (
        <div className="panel mx-auto max-w-xl text-center">
          <h2 className="section-title">Iniciar nueva evaluación</h2>
          <p className="page-sub mt-1 mb-5">
            Elige la ciudad o municipio. Se generará un PIN de 6 cifras y los alumnos verán la sala activa al momento.
          </p>
          <label className="label text-left" htmlFor="ex-city">
            Ciudad o municipio
          </label>
          <select id="ex-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Selecciona una ciudad</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {cities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c)}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  city === c ? "border-red bg-red text-white" : "border-line bg-paper text-ink2 hover:border-red hover:text-red"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button className="btn btn-cta mt-5 w-full" disabled={!city || busy} onClick={() => run(() => api.openSession(city))}>
            {busy && <LoaderCircle size={17} className="animate-spin" />} ABRIR EXAMEN Y GENERAR PIN
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-5">
            <div className="panel text-center">
              <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest text-muted uppercase">
                Código de acceso · {session.city}
              </div>
              <div className="my-2 font-display text-5xl font-bold tracking-[0.2em] text-red tabular-nums sm:text-6xl">{session.pin}</div>
              <p className="text-xs text-muted">Dáselo a los alumnos para que entren en la sala de espera.</p>
            </div>

            {session.status === "waiting" ? (
              <div className="panel space-y-4">
                <div className="flex items-center gap-2">
                  <span className="live-dot bg-amber" />
                  <h3 className="text-xs font-bold tracking-wide text-ink uppercase">Sala de espera abierta</h3>
                  <span className="badge badge-amber ml-auto">
                    <Users size={12} /> {waiting.length}
                  </span>
                </div>
                <div>
                  <label className="label" htmlFor="ex-min">
                    Duración del examen (minutos)
                  </label>
                  <input
                    id="ex-min"
                    className="input"
                    type="number"
                    min={1}
                    max={180}
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(1, Math.min(180, Number(e.target.value) || 1)))}
                  />
                </div>
                <button
                  className="btn btn-success w-full font-extrabold"
                  disabled={busy}
                  onClick={() => run(() => api.startSession(session.id, minutes))}
                >
                  <Play size={16} /> INICIAR EXAMEN PARA TODOS
                </button>
                <button className="btn btn-outline btn-sm w-full" disabled={busy} onClick={() => setConfirmClose(true)}>
                  Cancelar sesión
                </button>
              </div>
            ) : (
              <div className="panel space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-wide text-green uppercase">
                  <span className="live-dot bg-green" /> Examen en curso
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-muted uppercase">Tiempo restante</div>
                  <div className={`font-display text-5xl font-bold tabular-nums ${left === 0 ? "text-red" : "text-ink"}`}>
                    {formatClock(left)}
                  </div>
                  <p className={`mt-1 text-xs font-semibold ${left === 0 ? "text-red" : "text-muted"}`}>
                    {left === 0 ? "El tiempo ha terminado. Cierra la sesión para guardar a todos." : "Los alumnos ven la misma cuenta atrás."}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button className="btn btn-outline" disabled={busy} onClick={() => run(() => api.extendSession(session.id, 5))}>
                    <Plus size={15} /> 5 minutos
                  </button>
                  <button className="btn btn-danger" disabled={busy} onClick={() => setConfirmClose(true)}>
                    <Power size={15} /> Terminar y vaciar sala
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide text-muted uppercase">Seguimiento de alumnos ({attempts.length})</h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green">
                <span className="live-dot bg-green" /> En directo
              </span>
            </div>
            {attempts.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted italic">Esperando a que se conecten alumnos con el PIN…</p>
            ) : (
              <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                {attempts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3.5 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">{a.name}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        {a.status === "in_progress" && a.question_ids && (
                          <span>
                            {Object.keys(a.answers ?? {}).length}/{a.question_ids.length} respondidas
                          </span>
                        )}
                        {a.exits > 0 && (
                          <span className="font-semibold text-amber">
                            Salió de la pantalla {a.exits} {a.exits === 1 ? "vez" : "veces"}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge a={a} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={confirmClose}
        title={session?.status === "waiting" ? "¿Cancelar la sesión?" : "¿Terminar el examen?"}
        confirmLabel={session?.status === "waiting" ? "Cancelar sesión" : "Terminar y vaciar sala"}
        cancelLabel="Volver"
        busy={busy}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          if (session) run(() => api.closeSession(session.id));
        }}
      >
        {session?.status === "waiting"
          ? "Los alumnos de la sala de espera volverán al inicio y el PIN dejará de funcionar."
          : "Los alumnos que sigan respondiendo se entregarán con lo que lleven contestado. El PIN dejará de funcionar."}
      </Dialog>
    </Screen>
  );
}

