import { Check, X } from "lucide-react";
import type { ResultItem } from "../lib/api";

// Corrección pregunta a pregunta, en formato de lista numerada (como una hoja de corrección).
export function Breakdown({ items, numbered = true }: { items: ResultItem[]; numbered?: boolean }) {
  return (
    <ol className="divide-y divide-line">
      {items.map((item, idx) => (
        <li key={item.id} className="grid grid-cols-[28px_1fr] gap-x-3 py-4 first:pt-0 last:pb-0">
          <span
            className={`mt-0.5 grid h-6 w-6 place-items-center rounded ${item.ok ? "bg-green-soft text-green" : "bg-red-soft text-red"}`}
            aria-label={item.ok ? "Correcta" : "Incorrecta"}
          >
            {item.ok ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
          </span>
          <div>
            <p className="font-semibold text-ink">
              {numbered && <span className="tnum mr-1.5 text-muted">{idx + 1}.</span>}
              {item.question}
            </p>
            <dl className="mt-1.5 space-y-0.5 text-[15px]">
              <div className="flex gap-2">
                <dt className="shrink-0 text-muted">Respuesta dada:</dt>
                <dd className={item.ok ? "font-medium text-green" : "font-medium text-red"}>{item.options[item.selected]}</dd>
              </div>
              {!item.ok && (
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted">Correcta:</dt>
                  <dd className="font-medium text-ink">{item.options[item.correct]}</dd>
                </div>
              )}
            </dl>
            {item.explanation && <p className="mt-2 text-sm leading-relaxed text-muted">{item.explanation}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
