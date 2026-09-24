import { useRef } from "react";

// Código de 6 cifras en casillas separadas: avanza solo, admite pegar y retroceder.
export function PinInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setAt = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).replace(/\D/g, "").slice(0, 6);
    onChange(next);
  };

  return (
    <div className="flex gap-2" role="group" aria-label="Código del examen, 6 cifras">
      {digits.map((d, i) => (
        <input
          key={i}
          id={i === 0 ? id : undefined}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={6}
          aria-label={`Cifra ${i + 1}`}
          className={`input display h-14 w-full min-w-0 px-0 text-center text-3xl ${i === 3 ? "ml-2 sm:ml-3" : ""}`}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "");
            if (raw.length > 1) {
              // pegado o autocompletado
              onChange((value.slice(0, i) + raw).slice(0, 6));
              refs.current[Math.min(5, i + raw.length)]?.focus();
              return;
            }
            setAt(i, raw);
            if (raw) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d && i > 0) {
              e.preventDefault();
              setAt(i - 1, "");
              refs.current[i - 1]?.focus();
            }
            if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
            if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
          }}
        />
      ))}
    </div>
  );
}
