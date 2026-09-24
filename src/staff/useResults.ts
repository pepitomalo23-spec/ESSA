import { useCallback, useEffect, useState } from "react";
import type { Attempt } from "../lib/api";
import { supabase } from "../lib/supabase";

// Exámenes entregados (terminados, sin tiempo o abandonados), del más reciente al más antiguo.
export function useResults() {
  const [rows, setRows] = useState<Attempt[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await supabase
      .from("attempts")
      .select("*")
      .in("status", ["done", "timed_out", "left"])
      .order("created_at", { ascending: false })
      .limit(5000);
    if (res.error) setError("No se pudieron cargar los resultados.");
    else setRows(res.data as Attempt[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, error, reload: load, setRows };
}
