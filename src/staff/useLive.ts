import { useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

// Avisa cuando cambian filas de una tabla (tiempo real) y, por si la conexión en vivo falla,
// vuelve a consultar cada pocos segundos.
export function useLive(table: string, filter: string | null, onChange: () => void, fallbackMs = 6000) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (filter === null) return;
    const channel = supabase
      .channel(`live-${table}-${filter}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table, ...(filter ? { filter } : {}) }, () => cb.current())
      .subscribe();
    const id = setInterval(() => cb.current(), fallbackMs);
    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [table, filter, fallbackMs]);
}
