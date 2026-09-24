import type { Attempt } from "../lib/api";

const STATUS: Record<string, string> = {
  done: "Terminado",
  timed_out: "Sin tiempo",
  left: "Abandonó",
  in_progress: "En examen",
  waiting: "En sala",
};

export function downloadCsv(rows: Attempt[], filename: string) {
  const header = ["Nombre", "Email", "Ciudad", "Aciertos", "Total", "Porcentaje", "Resultado", "Estado", "Salidas de pantalla", "Valoración", "Comentario", "Fecha"];
  const lines = rows.map((r) => [
    r.name,
    r.email ?? "",
    r.city,
    r.score ?? "",
    r.total ?? "",
    r.pct != null ? `${r.pct}%` : "",
    r.pass ? "Apto" : "No apto",
    STATUS[r.status] ?? r.status,
    r.exits,
    r.rating ?? "",
    r.comment ?? "",
    new Date(r.created_at).toLocaleString("es-ES"),
  ]);
  const csv = [header, ...lines]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
