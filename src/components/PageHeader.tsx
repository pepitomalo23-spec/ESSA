import type { ReactNode } from "react";
import { Ecg } from "./Ecg";

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-paper">
      <div className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-red/10 blur-3xl" />
      <div className="container-x relative py-14 sm:py-20">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">{title}</h1>
        {children && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{children}</p>}
      </div>
      <Ecg className="-mb-px" />
    </section>
  );
}
