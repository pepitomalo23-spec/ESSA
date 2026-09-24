import type { SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const hasBackend = Boolean(url && key);

let client: Promise<SupabaseClient> | null = null;

// El SDK se descarga solo al enviar el formulario, así la carga inicial es más ligera.
function getClient() {
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url!, key!, { auth: { persistSession: false } }),
  );
  return client;
}

export type Preinscripcion = {
  nombre: string;
  email: string;
  telefono: string;
  curso: string;
  sede: string;
  mensaje: string;
};

// Sin variables de entorno la web funciona igual; el formulario abre el correo como alternativa.
export async function enviarPreinscripcion(data: Preinscripcion) {
  if (!hasBackend) throw new Error("NO_BACKEND");
  const supabase = await getClient();
  const { error } = await supabase.from("preinscripciones").insert({
    ...data,
    telefono: data.telefono || null,
    mensaje: data.mensaje || null,
    acepta_privacidad: true,
  });
  if (error) throw error;
}
