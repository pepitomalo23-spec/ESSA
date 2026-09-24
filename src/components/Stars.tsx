import { Star } from "lucide-react";

export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex justify-center gap-2" role="radiogroup" aria-label="Valoración de 1 a 5 estrellas">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`${v} ${v === 1 ? "estrella" : "estrellas"}`}
          onClick={() => onChange(v)}
          className={`cursor-pointer transition-transform hover:scale-110 ${value >= v ? "text-amber-400" : "text-line"}`}
        >
          <Star size={38} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  );
}

export function StarsView({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-amber-400" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((v) => (
        <Star key={v} size={14} fill={v <= value ? "currentColor" : "none"} strokeWidth={v <= value ? 0 : 1.5} />
      ))}
    </span>
  );
}
