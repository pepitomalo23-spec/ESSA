import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { Screen } from "../components/Screen";
import { useTitle } from "../lib/useTitle";

// Cabecera común de cada sección del panel: título, explicación breve y acciones a la derecha.
export function Page({
  title,
  description,
  actions,
  breadcrumb,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
}) {
  useTitle(title);
  return (
    <Screen>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
          <h1 className="display text-[34px] text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-[70ch] text-[15px] text-ink2">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </Screen>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-16 text-muted">
      <LoaderCircle size={18} className="animate-spin" /> Cargando…
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="sheet px-6 py-12 text-center text-[15px] text-muted">{children}</div>;
}

export function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={`note ${msg.ok ? "note-ok" : "note-error"}`} role={msg.ok ? "status" : "alert"}>
      {msg.text}
    </p>
  );
}
