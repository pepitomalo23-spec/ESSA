import type { ResultItem } from "../lib/api";

// Corrección de cada pregunta: lo que marcó el alumno, la correcta y la explicación.
export function Breakdown({ items, onlyFailed = false }: { items: ResultItem[]; onlyFailed?: boolean }) {
  const list = onlyFailed ? items.filter((i) => !i.ok) : items;
  return (
    <ol className="space-y-3">
      {list.map((item, idx) => (
        <li key={item.id} className="rounded-xl border border-line bg-bg p-4">
          <p className="text-sm leading-snug font-semibold text-ink">
            <span className="mr-1.5 font-display text-muted">{onlyFailed ? "✕" : idx + 1}.</span>
            {item.question}
          </p>
          <div className="mt-3 space-y-1.5">
            {item.options.map((opt, i) => {
              const isCorrect = i === item.correct;
              const isSelected = i === item.selected;
              if (!isCorrect && !isSelected) return null;
              return (
                <div
                  key={i}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    isCorrect ? "border-green/30 bg-green-soft text-green" : "border-red/30 bg-red-soft text-red"
                  }`}
                >
                  <span className="font-medium">{opt}</span>
                  <span className="text-[10px] font-bold tracking-wide uppercase">
                    {isCorrect && isSelected ? "Tu respuesta · correcta" : isCorrect ? "Respuesta correcta" : "Tu respuesta"}
                  </span>
                </div>
              );
            })}
          </div>
          {item.explanation && <p className="mt-2.5 text-xs leading-relaxed text-muted italic">{item.explanation}</p>}
        </li>
      ))}
    </ol>
  );
}
