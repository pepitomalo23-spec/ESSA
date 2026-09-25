import { ChevronRight, Download, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Breakdown } from "../components/Breakdown";
import { Dialog } from "../components/Dialog";
import { StarsView } from "../components/Stars";
import type { Attempt, Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { dayKey, timeOf } from "../lib/time";
import { downloadCsv } from "./csv";
import { StatusText } from "./ExamTab";
import { Empty, Loading, Page } from "./Page";
import { useResults } from "./useResults";

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const graded = (list: Attempt[]) => list.filter((r) => r.status !== "left");

export function HistoryTab({ me }: { me: Staff }) {
  const { rows, error, reload, setRows } = useResults();
  const [city, setCity] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [student, setStudent] = useState<Attempt | null>(null);
  const [toDelete, setToDelete] = useState<Attempt | null>(null);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const found = useMemo(
    () => (q ? (rows ?? []).filter((r) => r.name.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q)).slice(0, 50) : []),
    [rows, q],
  );
  const openStudent = (r: Attempt) => {
    setCity(r.city);
    setDay(dayKey(r.created_at));
    setStudent(r);
    setQuery("");
  };

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
    setToDelete(null);
    const res = await supabase.from("attempts").delete().eq("id", a.id);
    if (!res.error) {
      setRows((prev) => prev?.filter((r) => r.id !== a.id) ?? null);
      setStudent(null);
    }
  }

  const crumbs = [
    { label: "Historial", onClick: () => (setCity(null), setDay(null), setStudent(null)) },
    city && { label: city, onClick: () => (setDay(null), setStudent(null)) },
    day && { label: day, onClick: () => setStudent(null) },
    student && { label: student.name, onClick: () => {} },
  ].filter(Boolean) as { label: string; onClick: () => void }[];

  const breadcrumb =
    crumbs.length > 1 ? (
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} className="text-muted" />}
            {i < crumbs.length - 1 ? (
              <button className="cursor-pointer font-medium text-navy hover:underline" onClick={c.onClick}>
                {c.label}
              </button>
            ) : (
              <span className="text-muted">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
    ) : undefined;

  const scope = day ? dayRows : city ? cityRows : (rows ?? []);
  const title = student ? student.name : day ? `${city}, ${day}` : city ?? "Historial";

  return (
    <Page
      title={title}
      breadcrumb={breadcrumb}
      description={student ? undefined : day ? "Alumnos evaluados ese día. Abre uno para ver qué preguntas falló." : city ? "Días de examen en esta ciudad." : "Todos los exámenes entregados, agrupados por ciudad."}
      actions={
        !student && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={reload}>
              <RefreshCw size={15} /> Actualizar
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={!scope.length}
              onClick={() => downloadCsv(scope, `resultados_${(city ?? "todas").toLowerCase()}${day ? "_" + day.replace(/\//g, "-") : ""}.csv`)}
            >
              <Download size={15} /> Exportar CSV
            </button>
          </>
        )
      }
    >
      {error && <p className="note note-error mb-5">{error}</p>}
      {!rows ? (
        <Loading />
      ) : student ? (
        <StudentDetail a={student} canDelete={me.role === "admin"} onDelete={() => setToDelete(student)} />
      ) : day ? (
        <div className="sheet overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Hora</th>
                <th>Estado</th>
                <th className="num">Salidas</th>
                <th className="num">Nota</th>
                <th>Resultado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {dayRows.map((r) => (
                <tr key={r.id} className="row-link" onClick={() => setStudent(r)}>
                  <td className="font-medium text-ink">{r.name}</td>
                  <td className="tnum text-muted">{timeOf(r.created_at)}</td>
                  <td>
                    <StatusText a={r} />
                  </td>
                  <td className={`num ${r.exits ? "font-semibold text-amber" : "text-muted"}`}>{r.exits}</td>
                  <td className="num">{r.status === "left" ? "—" : `${r.score}/${r.total}`}</td>
                  <td>{r.status === "left" ? <span className="text-muted">—</span> : <span className={`font-semibold ${r.pass ? "text-green" : "text-red"}`}>{r.pass ? "Apto" : "No apto"}</span>}</td>
                  <td className="text-right text-muted">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : city ? (
        <div className="sheet overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Alumnos</th>
                <th className="num">Aptos</th>
                <th className="num">No aptos</th>
                <th className="num">Abandonos</th>
                <th className="num">% aptos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {byDay.map(([d, list]) => {
                const g = graded(list);
                const ok = g.filter((r) => r.pass).length;
                return (
                  <tr key={d} className="row-link" onClick={() => setDay(d)}>
                    <td className="tnum font-medium text-ink">{d}</td>
                    <td className="num">{list.length}</td>
                    <td className="num text-green">{ok}</td>
                    <td className="num text-red">{g.length - ok}</td>
                    <td className="num text-amber">{list.length - g.length}</td>
                    <td className="num font-semibold">{pct(ok, g.length)} %</td>
                    <td className="text-right text-muted">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="relative mb-5 max-w-md">
            <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              className="input pl-9"
              type="search"
              placeholder="Buscar alumno por nombre o email"
              aria-label="Buscar alumno"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {q ? (
            found.length === 0 ? (
              <Empty>Ningún alumno coincide con «{query.trim()}».</Empty>
            ) : (
              <div className="sheet overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Ciudad</th>
                      <th>Fecha</th>
                      <th className="num">Nota</th>
                      <th>Resultado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {found.map((r) => (
                      <tr key={r.id} className="row-link" onClick={() => openStudent(r)}>
                        <td className="font-medium text-ink">{r.name}</td>
                        <td>{r.city}</td>
                        <td className="tnum text-muted">{dayKey(r.created_at)}</td>
                        <td className="num">{r.status === "left" ? "—" : `${r.score}/${r.total}`}</td>
                        <td>
                          {r.status === "left" ? (
                            <span className="text-amber">Abandonó</span>
                          ) : (
                            <span className={`font-semibold ${r.pass ? "text-green" : "text-red"}`}>{r.pass ? "Apto" : "No apto"}</span>
                          )}
                        </td>
                        <td className="text-right text-muted">
                          <ChevronRight size={16} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : byCity.length === 0 ? (
            <Empty>Todavía no hay exámenes entregados. Aparecerán aquí en cuanto termine el primero.</Empty>
          ) : (
        <div className="sheet overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Ciudad</th>
                <th className="num">Días de examen</th>
                <th className="num">Alumnos</th>
                <th className="num">% aptos</th>
                <th>Último examen</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {byCity.map(([c, list]) => {
                const g = graded(list);
                return (
                  <tr key={c} className="row-link" onClick={() => setCity(c)}>
                    <td className="font-medium text-ink">{c}</td>
                    <td className="num">{new Set(list.map((r) => dayKey(r.created_at))).size}</td>
                    <td className="num">{list.length}</td>
                    <td className="num font-semibold">{pct(g.filter((r) => r.pass).length, g.length)} %</td>
                    <td className="tnum text-muted">{dayKey(list[0].created_at)}</td>
                    <td className="text-right text-muted">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
          )}
        </>
      )}

      <Dialog open={!!toDelete} title="¿Borrar este resultado?" confirmLabel="Borrar" onCancel={() => setToDelete(null)} onConfirm={() => toDelete && remove(toDelete)}>
        Se eliminará el examen de {toDelete?.name}. No se puede deshacer.
      </Dialog>
    </Page>
  );
}

function StudentDetail({ a, canDelete, onDelete }: { a: Attempt; canDelete: boolean; onDelete: () => void }) {
  const [onlyFailed, setOnlyFailed] = useState(true);
  const items = a.results ?? [];
  const failed = items.filter((r) => !r.ok);
  const unanswered = (a.total ?? 0) - items.length;

  return (
    <div className="space-y-5">
      <div className="sheet grid overflow-hidden sm:grid-cols-4 sm:divide-x sm:divide-line">
        <Cell label="Nota">
          <span className="display tnum text-4xl text-ink">
            {a.status === "left" ? "—" : a.score}
            {a.status !== "left" && <span className="text-2xl text-muted">/{a.total}</span>}
          </span>
        </Cell>
        <Cell label="Resultado">
          {a.status === "left" ? (
            <span className="display text-3xl text-amber">Abandonó</span>
          ) : (
            <span className={`display text-3xl ${a.pass ? "text-green" : "text-red"}`}>{a.pass ? "Apto" : "No apto"}</span>
          )}
          <span className="tnum block text-sm text-muted">{a.pct} % de aciertos</span>
        </Cell>
        <Cell label="Realizado">
          <span className="tnum block text-[15px] font-medium text-ink">
            {dayKey(a.created_at)}, {timeOf(a.created_at)}
          </span>
          <span className="block text-sm text-muted">{a.city}</span>
        </Cell>
        <Cell label="Salidas de pantalla">
          <span className={`display tnum text-3xl ${a.exits ? "text-amber" : "text-ink"}`}>{a.exits}</span>
          {unanswered > 0 && <span className="block text-sm text-muted">{unanswered} sin responder</span>}
        </Cell>
      </div>

      {a.rating && (
        <div className="sheet p-5">
          <p className="eyebrow mb-1.5">Valoración del curso</p>
          <StarsView value={a.rating} />
          {a.comment && <p className="mt-2 text-[15px] text-ink2">«{a.comment}»</p>}
        </div>
      )}

      <div className="sheet p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-2xl text-ink">{onlyFailed ? `Preguntas falladas (${failed.length})` : `Todas las respuestas (${items.length})`}</h2>
          {items.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setOnlyFailed((v) => !v)}>
              {onlyFailed ? "Ver todas" : "Ver solo fallos"}
            </button>
          )}
        </div>
        {a.status === "left" && <p className="note note-warn mb-5">Abandonó el examen antes de terminar. Se muestran las respuestas que llegó a dar.</p>}
        {onlyFailed && failed.length === 0 ? (
          <p className="text-[15px] text-muted">{items.length ? "No falló ninguna de las preguntas que respondió." : "No llegó a responder ninguna pregunta."}</p>
        ) : (
          <Breakdown items={onlyFailed ? failed : items} numbered={!onlyFailed} />
        )}
      </div>

      {canDelete && (
        <button className="btn btn-danger-ghost btn-sm" onClick={onDelete}>
          <Trash2 size={15} /> Borrar este resultado
        </button>
      )}
    </div>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-line p-5 last:border-b-0 sm:border-b-0">
      <p className="eyebrow mb-1">{label}</p>
      {children}
    </div>
  );
}
