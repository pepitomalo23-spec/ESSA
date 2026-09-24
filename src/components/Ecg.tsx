import { useMemo } from "react";

// Traza de electrocardiograma: un latido por pregunta. La parte ya recorrida se dibuja en rojo.
// Es el motivo de la app original, aquí con una función concreta: indicar el progreso del examen.
export function EcgProgress({ current, total }: { current: number; total: number }) {
  const W = 600;
  const H = 36;
  const n = Math.max(total, 1);

  const d = useMemo(() => {
    const step = W / n;
    const mid = H / 2;
    const parts = [`M0,${mid}`];
    for (let i = 0; i < n; i++) {
      const x = i * step;
      parts.push(
        `L${x + step * 0.42},${mid}`,
        `L${x + step * 0.5},${mid - 13}`,
        `L${x + step * 0.58},${mid + 9}`,
        `L${x + step * 0.64},${mid}`,
        `L${x + step},${mid}`,
      );
    }
    return parts.join(" ");
  }, [n]);

  const done = Math.min(1, current / n);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block h-9 w-full" role="img" aria-label={`Pregunta ${Math.min(current + 1, n)} de ${n}`}>
      <path d={d} fill="none" stroke="var(--line-strong)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
      <path
        d={d}
        fill="none"
        stroke="var(--red)"
        strokeWidth="2"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1 - done, transition: "stroke-dashoffset .45s ease" }}
      />
    </svg>
  );
}
