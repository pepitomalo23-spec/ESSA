import { createClient } from "@supabase/supabase-js";

// La clave publicable es pública por diseño: lo que protege los datos son las políticas RLS
// y las funciones del servidor (supabase/migrations). Las variables de entorno permiten cambiar de proyecto.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://gepwhdcghtrmzteiuizq.supabase.co";
const key =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || "sb_publishable_ypO_80xaiaOee3R9RDEgpA_6XLg_KKS";

export const supabase = createClient(url, key, {
  auth: { persistSession: true, storageKey: "essa-staff-auth" },
});
