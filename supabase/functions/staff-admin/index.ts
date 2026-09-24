// Gestión de cuentas del personal. Necesita la service role key, por eso vive en el servidor.
// Acciones:
//   bootstrap        → crea el primer administrador (solo si todavía no existe ninguno)
//   create           → un administrador da de alta a un instructor o administrador
//   delete           → un administrador elimina una cuenta (no la suya)
//   reset_password   → un administrador cambia la contraseña de otra cuenta
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Petición no válida" }, 400);
  }
  const action = String(body.action ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();
  const name = String(body.name ?? "").trim();
  const password = String(body.password ?? "");

  const validateNew = () => {
    if (!EMAIL_RE.test(email)) return "El email no es válido.";
    if (name.length < 2) return "Escribe el nombre completo.";
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    return null;
  };

  const createAccount = async (role: "admin" | "instructor") => {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) {
      const taken = error?.message?.toLowerCase().includes("already");
      return json({ error: taken ? "Ya existe una cuenta con ese email." : "No se pudo crear la cuenta." }, 400);
    }
    const { error: insErr } = await admin.from("staff").insert({ user_id: data.user.id, email, name, role });
    if (insErr) {
      await admin.auth.admin.deleteUser(data.user.id);
      return json({ error: "No se pudo registrar la cuenta en el equipo." }, 400);
    }
    return json({ ok: true, user_id: data.user.id });
  };

  if (action === "bootstrap") {
    const { count } = await admin.from("staff").select("user_id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) return json({ error: "La cuenta de administrador ya está creada." }, 403);
    const problem = validateNew();
    if (problem) return json({ error: problem }, 400);
    return createAccount("admin");
  }

  // El resto de acciones exigen un administrador con sesión iniciada.
  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(jwt);
  if (!who?.user) return json({ error: "Inicia sesión de nuevo." }, 401);
  const { data: me } = await admin.from("staff").select("role").eq("user_id", who.user.id).maybeSingle();
  if (me?.role !== "admin") return json({ error: "Solo un administrador puede hacer esto." }, 403);

  if (action === "create") {
    const role = body.role === "admin" ? "admin" : "instructor";
    const problem = validateNew();
    if (problem) return json({ error: problem }, 400);
    return createAccount(role);
  }

  const userId = String(body.user_id ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ error: "Cuenta no válida." }, 400);

  if (action === "delete") {
    if (userId === who.user.id) return json({ error: "No puedes eliminar tu propia cuenta." }, 400);
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return json({ error: "No se pudo eliminar la cuenta." }, 400);
    return json({ ok: true });
  }

  if (action === "reset_password") {
    if (password.length < 8) return json({ error: "La contraseña debe tener al menos 8 caracteres." }, 400);
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return json({ error: "No se pudo cambiar la contraseña." }, 400);
    return json({ ok: true });
  }

  return json({ error: "Acción desconocida." }, 400);
});
