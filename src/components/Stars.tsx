import { Star } from "lucide-react";
import { useState } from "react";

const LABELS = ["", "Muy mal", "Mejorable", "Correcto", "Muy bien", "Excelente"];

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex gap-1" role="radiogroup" aria-label="Valoración de 1 a 5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`${v} de 5: ${LABELS[v]}`}
            onMouseEnter={() => setHover(v)}
            onClick={() => onChange(v)}
            className={`cursor-pointer p-1 transition-colors ${shown >= v ? "text-[#e0a106]" : "text-line-strong"}`}
          >
            <Star size={30} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted">{LABELS[shown] || "Elige de 1 a 5"}</span>
    </div>
  );
}

export function StarsView({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-px text-[#e0a106]" aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} size={14} fill={v <= value ? "currentColor" : "none"} strokeWidth={v <= value ? 0 : 1.5} />
      ))}
    </span>
  );
}
