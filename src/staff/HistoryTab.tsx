import { ArrowLeft, ChevronRight, Download, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Breakdown } from "../components/Breakdown";
import { Dialog } from "../components/Dialog";
import { Screen } from "../components/Screen";
import { StarsView } from "../components/Stars";
import type { Attempt, Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { dayKey, timeOf } from "../lib/time";
import { downloadCsv } from "./csv";
import { StatusBadge } from "./ExamTab";
import { useResults } from "./useResults";

export function HistoryTab({ me }: { me: Staff }) {
  const { rows, error, reload, setRows } = useResults();
  const [city, setCity] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [student, setStudent] = useState<Attempt | null>(null);
  const [toDelete, setToDelete] = useState<Attempt | null>(null);

  const byCity = useMemo(() => {
    const map = new Map<string, Attempt[]>();
    for (const r of rows ?? []) map.set(r.city, [...(map.get(r.city) ?? []), r]);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  }, [rows]);

  const cityRows = useMemo(() => (rows ?? []).filter((r) => r.city === city), [rows, city]);
  const byDay = useMemo(() => {
    const map = new Map<string, Attempt[]>();
    for (const r of cityRows) map.set(dayKey(r.created_at), [...(map.get(dayKey(r.created_at)) ?? []), r]);
    return [...map.entries()];
  }, [cityRows]);
  const dayRows = useMemo(() => cityRows.filter((r) => dayKey(r.created_at) === day), [cityRows, day]);

  async function remove(a: Attempt) {
    const res = await supabase.from("attempts").delete().eq("id", a.id);
    setToDelete(null);
    if (!res.error) {
      setRows((prev) => prev?.filter((r) => r.id !== a.id) ?? null);
      setStudent(null);
    }
  }

  const back = student ? () => setStudent(null) : day ? () => setDay(null) : city ? () => setCity(null) : null;
  const subtitle = student
    ? `Examen de ${student.name}`
    : day
      ? `Alumnos evaluados el ${day} en ${city}`
      : city
        ? `Días de examen en ${city}`
        : "Elige una ciudad para ver sus exámenes anteriores.";

  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Historial por ciudades</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {back && (
            <button className="btn btn-outline btn-sm" onClick={back}>
              <ArrowLeft size={14} /> Volver
            </button>
          )}
          {!student && (
            <button
              className="btn btn-outline btn-sm"
              disabled={!rows?.length}
              onClick={() =>
                downloadCsv(day ? dayRows : city ? cityRows : (rows ?? []), `resultados_${(city ?? "todas").toLowerCase()}${day ? "_" + day.replace(/\//g, "-") : ""}.csv`)
              }
            >
              <Download size={14} /> Exportar CSV
            </button>
          )}
          <button className="btn btn-outline btn-sm" onClick={reload} aria-label="Recargar">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {error && <p className="alert alert-error">{error}</p>}
      {!rows ? (
        <div className="flex justify-center py-16 text-muted">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : student ? (
        <StudentDetail a={student} canDelete={me.role === "admin"} onDelete={() => setToDelete(student)} />
      ) : day ? (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="data-table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Hora</th>
                <th>Nota</th>
                <th>Estado</th>
                <th className="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold text-ink">
                    {r.name}
                    {r.exits > 0 && <div className="text-[11px] font-medium text-amber">Salió {r.exits}×</div>}
                  </td>
                  <td className="text-muted tabular-nums">{timeOf(r.created_at)}</td>
                  <td className="font-bold tabular-nums">{r.status === "left" ? "—" : `${r.score}/${r.total} (${r.pct}%)`}</td>
                  <td>
                    {r.status === "left" ? (
                      <span className="badge badge-amber">Abandonó</span>
                    ) : r.pass ? (
                      <span className="badge badge-green">Aprobado</span>
                    ) : (
                      <span className="badge badge-red">Suspenso</span>
                    )}
                  </td>
                  <td className="text-right">
                    <button className="btn btn-primary btn-sm" onClick={() => setStudent(r)}>
                      Ver fallos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : city ? (
        <div className="grid gap-4 md:grid-cols-2">
          {byDay.map(([d, list]) => (
            <button key={d} className="panel cursor-pointer text-left transition hover:border-red/40" onClick={() => setDay(d)}>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-ink tabular-nums">{d}</span>
                <span className="badge badge-red">{list.length} alumnos</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-line bg-paper p-3 text-center">
                <Stat label="Aprobados" value={list.filter((r) => r.pass).length} tone="text-green" />
                <Stat label="Suspensos" value={list.filter((r) => !r.pass && r.status !== "left").length} tone="text-red" />
                <Stat label="Abandonos" value={list.filter((r) => r.status === "left").length} tone="text-amber" />
              </div>
            </button>
          ))}
        </div>
      ) : byCity.length === 0 ? (
        <p className="panel py-12 text-center text-sm text-muted">Todavía no hay exámenes entregados.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byCity.map(([c, list]) => (
            <button key={c} className="panel group cursor-pointer text-left transition hover:border-red/40" onClick={() => setCity(c)}>
              <div className="font-display text-lg font-bold text-ink group-hover:text-red">{c}</div>
              <p className="mt-1 text-xs text-muted">
                {list.length} alumnos evaluados · {new Set(list.map((r) => dayKey(r.created_at))).size} días de examen
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-red">
                Ver exámenes <ChevronRight size={14} />
              </span>
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={!!toDelete}
        title="¿Borrar este resultado?"
        confirmLabel="Borrar resultado"
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && remove(toDelete)}
      >
        Se eliminará el examen de {toDelete?.name}. No se puede deshacer.
      </Dialog>
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className={`text-[10px] font-bold tracking-wide uppercase ${tone}`}>{label}</div>
      <div className="font-display text-lg font-bold text-ink tabular-nums">{value}</div>
    </div>
  );
}

function StudentDetail({ a, canDelete, onDelete }: { a: Attempt; canDelete: boolean; onDelete: () => void }) {
  const failed = (a.results ?? []).filter((r) => !r.ok);
  const unanswered = (a.total ?? 0) - (a.results?.length ?? 0);
  return (
    <div className="space-y-5">
      <div className="panel flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-bold text-ink">{a.name}</h3>
            <span className="badge badge-muted">{a.city}</span>
            <StatusBadge a={a} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {new Date(a.created_at).toLocaleDateString("es-ES")} a las {timeOf(a.created_at)}
            {a.email && ` · ${a.email}`}
            {a.exits > 0 && <span className="font-semibold text-amber"> · Salió de la pantalla {a.exits} {a.exits === 1 ? "vez" : "veces"}</span>}
          </p>
          {a.rating && (
            <div className="mt-3 max-w-xl rounded-xl border border-amber/25 bg-amber-soft p-3">
              <StarsView value={a.rating} />
              {a.comment && <p className="mt-1 text-sm text-ink2 italic">«{a.comment}»</p>}
            </div>
          )}
        </div>
        <div className="shrink-0 md:text-right">
          <div className="text-[11px] font-bold tracking-wide text-muted uppercase">Puntuación</div>
          <div className={`font-display text-4xl font-bold tabular-nums ${a.pass ? "text-green" : "text-red"}`}>
            {a.score}/{a.total}
          </div>
          <div className="text-xs font-semibold text-muted">{a.pct}%</div>
        </div>
      </div>

      <h4 className="flex items-center gap-2 text-sm font-bold tracking-wide text-ink uppercase">
        <span className="h-2.5 w-2.5 rounded-full bg-red" /> Preguntas falladas ({failed.length})
        {unanswered > 0 && <span className="badge badge-amber normal-case">{unanswered} sin responder</span>}
      </h4>
      {a.status === "left" && (
        <p className="alert alert-warn">El alumno abandonó el examen antes de terminarlo. Se muestran las respuestas que llegó a dar.</p>
      )}
      {failed.length === 0 ? (
        <p className="alert alert-ok">
          {a.status === "left" || unanswered > 0 ? "No falló ninguna de las preguntas que respondió." : `¡Examen perfecto! Aprobó con el ${a.pct}%.`}
        </p>
      ) : (
        <Breakdown items={failed} onlyFailed />
      )}

      {canDelete && (
        <button className="btn btn-outline btn-sm text-red" onClick={onDelete}>
          <Trash2 size={14} /> Borrar este resultado
        </button>
      )}
    </div>
  );
}
