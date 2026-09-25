// Visita diaria a la base de datos para que Supabase (plan gratuito) no pause el proyecto por inactividad.
// La lanza Vercel Cron una vez al día (ver "crons" en vercel.json). Hace una consulta real y ligera.
const URL = process.env.VITE_SUPABASE_URL || "https://gepwhdcghtrmzteiuizq.supabase.co";
const KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ypO_80xaiaOee3R9RDEgpA_6XLg_KKS";

export async function GET(request) {
  // Si en Vercel se define CRON_SECRET, solo el propio Vercel Cron puede lanzarla.
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("No autorizado", { status: 401 });
  }
  const started = Date.now();
  const res = await fetch(`${URL}/rest/v1/rpc/public_info`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: "{}",
  });
  return Response.json(
    { ok: res.ok, status: res.status, ms: Date.now() - started, at: new Date().toISOString() },
    { status: res.ok ? 200 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
