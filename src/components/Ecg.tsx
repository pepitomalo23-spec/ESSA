// Línea de electrocardiograma: el motivo visual de la app de evaluación, ahora animado.
const PATH =
  "M0,30 L140,30 L152,30 L160,18 L168,30 L178,30 L186,4 L196,54 L206,30 L216,30 L228,22 L240,30 L400,30 L412,30 L420,18 L428,30 L438,30 L446,4 L456,54 L466,30 L476,30 L488,22 L500,30 L800,30";

export function Ecg({
  className = "",
  color = "var(--red)",
  track = "var(--line)",
  animated = true,
}: {
  className?: string;
  color?: string;
  track?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 800 60"
      preserveAspectRatio="none"
      className={`block h-10 w-full overflow-visible ${className}`}
      aria-hidden="true"
    >
      <path d={PATH} fill="none" stroke={track} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {animated && (
        <path
          d={PATH}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="ecg-run"
          pathLength={1000}
          style={{ ["--len" as string]: "1000", filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  );
}
