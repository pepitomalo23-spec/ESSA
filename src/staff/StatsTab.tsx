import { Download, LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { Screen } from "../components/Screen";
import { StarsView } from "../components/Stars";
import { dayKey } from "../lib/time";
import { downloadCsv } from "./csv";
import { useResults } from "./useResults";

export function StatsTab() {
  const { rows, error } = useResults();

  const stats = useMemo(() => {
    const list = rows ?? [];
    const graded = list.filter((r) => r.status !== "left");
    const rated = list.filter((r) => r.rating);
    const fails = new Map<string, { question: string; failed: number; seen: number }>();
    for (const r of list)
      for (const item of r.results ?? []) {
        const cur = fails.get(item.question) ?? { question: item.question, failed: 0, seen: 0 };
        cur.seen++;
        if (!item.ok) cur.failed++;
        fails.set(item.question, cur);
      }
    return {
      total: list.length,
      passPct: graded.length ? Math.round((graded.filter((r) => r.pass).length / graded.length) * 100) : 0,
      avgPct: graded.length ? Math.round(graded.reduce((s, r) => s + (r.pct ?? 0), 0) / graded.length) : 0,
      avgRating: rated.length ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1) : "—",
      left: list.filter((r) => r.status === "left").length,
      worst: [...fails.values()]
        .filter((f) => f.failed > 0)
        .sort((a, b) => b.failed / b.seen - a.failed / a.seen || b.failed - a.failed)
        .slice(0, 8),
      reviews: rated.filter((r) => r.comment).slice(0, 12),
    };
  }, [rows]);

  if (!rows)
    return (
      <div className="flex justify-center py-16 text-muted">
        {error ? <p className="alert alert-error">{error}</p> : <LoaderCircle className="animate-spin" />}
      </div>
    );

  return (
    <Screen>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Resumen de todas las evaluaciones</h2>
        <button className="btn btn-outline btn-sm" disabled={!rows.length} onClick={() => downloadCsv(rows, "resultados_essa.csv")}>
          <Download size={14} /> Exportar todo (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Alumnos evaluados" value={String(stats.total)} />
        <Kpi label="Aprobados" value={`${stats.passPct}%`} />
        <Kpi label="Nota media" value={`${stats.avgPct}%`} />
        <Kpi label="Valoración media" value={stats.avgRating} suffix={stats.avgRating !== "—" ? "/ 5" : ""} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel">
          <h3 className="section-title">Preguntas que más se fallan</h3>
          <p className="mb-4 text-xs text-muted">Porcentaje de alumnos que la fallaron entre quienes la respondieron.</p>
          {stats.worst.length === 0 ? (
            <p className="text-sm text-muted italic">Aún no hay fallos registrados.</p>
          ) : (
            <ul className="space-y-3.5">
              {stats.worst.map((f) => {
                const pct = Math.round((f.failed / f.seen) * 100);
                return (
                  <li key={f.question}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-ink2">{f.question}</span>
                      <span className="shrink-0 font-bold text-red tabular-nums">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-red" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1 text-[11px] text-muted tabular-nums">
                      {f.failed} de {f.seen} alumnos
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3 className="section-title mb-4">Últimas opiniones</h3>
          {stats.reviews.length === 0 ? (
            <p className="text-sm text-muted italic">Todavía no hay comentarios.</p>
          ) : (
            <ul className="space-y-3">
              {stats.reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-line bg-paper p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{r.name}</span>
                    <StarsView value={r.rating ?? 0} />
                  </div>
                  <div className="text-[11px] text-muted">
                    {r.city} · {dayKey(r.created_at)}
                  </div>
                  <p className="mt-1.5 text-sm text-ink2 italic">«{r.comment}»</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Screen>
  );
}

function Kpi({ label, value, suffix = "" }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="panel text-center">
      <div className="font-display text-3xl font-bold text-ink tabular-nums">
        {value} <span className="text-base text-muted">{suffix}</span>
      </div>
      <div className="mt-1 text-[11px] font-bold tracking-wide text-muted uppercase">{label}</div>
    </div>
  );
}
