import { useMemo } from "react";

// Línea de electrocardiograma bajo la cabecera, como en la app original.
// En el examen avanza con cada pregunta; fuera del examen late suavemente.
export function Ecg({ current, total }: { current?: number; total?: number }) {
  const W = 680;
  const H = 40;
  const beats = total && total > 0 ? total : 3;

  const d = useMemo(() => {
    const step = (W - 40) / beats;
    const pts: string[] = [`M0,${H / 2}`, `L20,${H / 2}`];
    for (let i = 0; i < beats; i++) {
      const x = 20 + i * step;
      pts.push(
        `L${x + step * 0.35},${H / 2}`,
        `L${x + step * 0.45},${H / 2 - 14}`,
        `L${x + step * 0.55},${H / 2 + 10}`,
        `L${x + step * 0.65},${H / 2}`,
        `L${x + step},${H / 2}`,
      );
    }
    pts.push(`L${W},${H / 2}`);
    return pts.join(" ");
  }, [beats]);

  const progress = total ? Math.min(1, (current ?? 0) / total) : null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mb-5 block h-10 w-full overflow-visible" aria-hidden="true">
      <path d={d} fill="none" stroke="var(--line)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {progress === null ? (
        <path
          d={d}
          fill="none"
          stroke="var(--red)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1000}
          className="ecg-run"
          style={{ ["--len" as string]: "1000", opacity: 0.55 }}
        />
      ) : (
        <path
          d={d}
          fill="none"
          stroke="var(--red)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1000}
          style={{
            strokeDasharray: 1000,
            strokeDashoffset: 1000 * (1 - progress),
            transition: "stroke-dashoffset .5s ease",
            filter: "drop-shadow(0 0 4px color-mix(in srgb, var(--red) 60%, transparent))",
          }}
        />
      )}
    </svg>
  );
}
