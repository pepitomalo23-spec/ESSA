import { Download } from "lucide-react";
import { useMemo } from "react";
import { StarsView } from "../components/Stars";
import { dayKey } from "../lib/time";
import { downloadCsv } from "./csv";
import { Empty, Loading, Page } from "./Page";
import { useResults } from "./useResults";

export function StatsTab() {
  const { rows, error } = useResults();

  const s = useMemo(() => {
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
    const dist = [1, 2, 3, 4, 5].map((n) => rated.filter((r) => r.rating === n).length);
    return {
      total: list.length,
      passPct: graded.length ? Math.round((graded.filter((r) => r.pass).length / graded.length) * 100) : null,
      avgPct: graded.length ? Math.round(graded.reduce((acc, r) => acc + (r.pct ?? 0), 0) / graded.length) : null,
      avgRating: rated.length ? rated.reduce((acc, r) => acc + (r.rating ?? 0), 0) / rated.length : null,
      rated: rated.length,
      left: list.length - graded.length,
      dist,
      worst: [...fails.values()]
        .filter((f) => f.failed > 0)
        .sort((a, b) => b.failed / b.seen - a.failed / a.seen || b.failed - a.failed)
        .slice(0, 8),
      reviews: rated.filter((r) => r.comment).slice(0, 10),
    };
  }, [rows]);

  return (
    <Page
      title="Estadísticas"
      description="Resumen de todas las evaluaciones entregadas."
      actions={
        rows?.length ? (
          <button className="btn btn-secondary btn-sm" onClick={() => downloadCsv(rows, "resultados_essa.csv")}>
            <Download size={15} /> Exportar todo (CSV)
          </button>
        ) : null
      }
    >
      {error && <p className="note note-error mb-5">{error}</p>}
      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty>Aún no hay datos. Las estadísticas aparecerán cuando se entregue el primer examen.</Empty>
      ) : (
        <div className="space-y-6">
          <div className="sheet grid grid-cols-2 overflow-hidden lg:grid-cols-4 [&>*]:border-line [&>*:nth-child(-n+2)]:border-b lg:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(odd)]:border-r lg:[&>*:not(:last-child)]:border-r">
            <Kpi label="Alumnos evaluados" value={String(s.total)} note={`${s.left} abandonos`} />
            <Kpi label="Aptos" value={s.passPct == null ? "—" : `${s.passPct} %`} note="de los que terminaron" />
            <Kpi label="Nota media" value={s.avgPct == null ? "—" : `${s.avgPct} %`} note="de aciertos" />
            <Kpi label="Valoración media" value={s.avgRating == null ? "—" : s.avgRating.toFixed(1).replace(".", ",")} note={`${s.rated} valoraciones`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="sheet p-5 sm:p-6">
              <h2 className="display text-2xl text-ink">Preguntas que más se fallan</h2>
              <p className="mt-1 mb-5 text-sm text-muted">Porcentaje de alumnos que la fallaron, entre quienes la respondieron.</p>
              {s.worst.length === 0 ? (
                <p className="text-[15px] text-muted">Sin fallos registrados.</p>
              ) : (
                <ol className="space-y-4">
                  {s.worst.map((f, i) => {
                    const p = Math.round((f.failed / f.seen) * 100);
                    return (
                      <li key={f.question} className="grid grid-cols-[22px_1fr_auto] items-baseline gap-x-3">
                        <span className="display tnum text-lg text-muted">{i + 1}</span>
                        <div>
                          <p className="text-[15px] text-ink">{f.question}</p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                            <div className="h-full bg-red" style={{ width: `${p}%` }} />
                          </div>
                        </div>
                        <span className="tnum text-right text-sm">
                          <span className="font-semibold text-ink">{p} %</span>
                          <span className="block text-muted">
                            {f.failed}/{f.seen}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="sheet p-5 sm:p-6">
              <h2 className="display text-2xl text-ink">Opiniones</h2>
              {s.rated > 0 && (
                <div className="mt-4 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((n) => {
                    const c = s.dist[n - 1];
                    return (
                      <div key={n} className="grid grid-cols-[16px_1fr_28px] items-center gap-2 text-sm">
                        <span className="tnum text-muted">{n}</span>
                        <div className="h-1.5 overflow-hidden rounded-full bg-line">
                          <div className="h-full bg-[#e0a106]" style={{ width: `${(c / s.rated) * 100}%` }} />
                        </div>
                        <span className="tnum text-right text-muted">{c}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <ul className="mt-5 divide-y divide-line">
                {s.reviews.length === 0 && <li className="py-3 text-[15px] text-muted">Todavía no hay comentarios.</li>}
                {s.reviews.map((r) => (
                  <li key={r.id} className="py-3.5 first:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <StarsView value={r.rating ?? 0} />
                      <span className="tnum text-xs text-muted">
                        {r.city} · {dayKey(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[15px] text-ink2">«{r.comment}»</p>
                    <p className="mt-0.5 text-sm text-muted">{r.name}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </Page>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="p-5 sm:p-6">
      <p className="eyebrow">{label}</p>
      <p className="display tnum mt-1 text-5xl text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-muted">{note}</p>
    </div>
  );
}
