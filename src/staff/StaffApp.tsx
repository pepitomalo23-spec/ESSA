import type { Session } from "@supabase/supabase-js";
import { AnimatePresence } from "motion/react";
import { KeyRound, LoaderCircle, LogOut } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "../components/Dialog";
import { Screen } from "../components/Screen";
import { Shell } from "../components/Shell";
import { api, errorMessage, staffAdmin, type Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { AdminTabs, type AdminTab } from "./AdminTabs";
import { ExamTab } from "./ExamTab";
import { HistoryTab } from "./HistoryTab";
import { StatsTab } from "./StatsTab";

type Tab = "exam" | "history" | "stats" | AdminTab;

const INSTRUCTOR_TABS: { id: Tab; label: string }[] = [
  { id: "exam", label: "Examen" },
  { id: "history", label: "Historial" },
  { id: "stats", label: "Estadísticas" },
];
const ADMIN_TABS: { id: Tab; label: string }[] = [
  { id: "questions", label: "Preguntas" },
  { id: "cities", label: "Ciudades" },
  { id: "staff", label: "Personal" },
  { id: "allowed", label: "Alumnos autorizados" },
  { id: "settings", label: "Ajustes" },
];

export default function StaffApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<Staff | null | undefined>(undefined);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [tab, setTab] = useState<Tab>("exam");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    api
      .publicInfo()
      .then((i) => setSetupNeeded(i.setup_needed))
      .catch(() => {});
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setMe(session === null ? null : undefined);
      return;
    }
    supabase
      .from("staff")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle()
      .then((res) => setMe((res.data as Staff | null) ?? null));
  }, [session]);

  const loading = session === undefined || (session && me === undefined);
  const tabs = me?.role === "admin" ? [...INSTRUCTOR_TABS, ...ADMIN_TABS] : INSTRUCTOR_TABS;

  return (
    <Shell wide={!!me} footer={!session && <Link to="/" className="text-xs text-muted hover:text-ink">← Volver a la evaluación</Link>}>
      {loading ? (
        <div className="flex justify-center py-20 text-muted">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : !session ? (
        setupNeeded ? (
          <Setup onDone={() => setSetupNeeded(false)} />
        ) : (
          <Login />
        )
      ) : !me ? (
        <div className="card mx-auto max-w-lg text-center">
          <h2 className="page-title">Cuenta sin permisos</h2>
          <p className="page-sub mt-2">Esta cuenta no pertenece al personal de ESSA. Pide a un administrador que te dé de alta.</p>
          <button className="btn btn-outline mt-6" onClick={() => supabase.auth.signOut()}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <Screen>
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <h1 className="page-title">{me.role === "admin" ? "Panel de administración" : "Panel de instructor"}</h1>
                <p className="text-sm text-muted">
                  {me.name} · <span className="badge badge-navy">{me.role === "admin" ? "Administrador" : "Instructor"}</span>
                </p>
              </div>
              <AccountMenu />
            </div>

            <nav className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Secciones del panel">
              {tabs.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} className="tab" onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                {tab === "exam" && <ExamTab key="exam" me={me} />}
                {tab === "history" && <HistoryTab key="history" me={me} />}
                {tab === "stats" && <StatsTab key="stats" />}
                {me.role === "admin" && ADMIN_TABS.some((t) => t.id === tab) && (
                  <AdminTabs key={tab} tab={tab as AdminTab} me={me} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </Screen>
      )}
    </Shell>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(/fetch/i.test(error.message) ? "Sin conexión. Inténtalo de nuevo." : "Email o contraseña incorrectos.");
  }

  return (
    <Screen>
      <form className="card mx-auto max-w-lg" onSubmit={submit}>
        <h1 className="page-title">Acceso de personal ESSA</h1>
        <p className="page-sub mt-1 mb-6">Instructores y administradores. Usa la cuenta que te ha asignado la escuela.</p>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="lg-email">
              Email
            </label>
            <input id="lg-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="lg-pass">
              Contraseña
            </label>
            <input
              id="lg-pass"
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="alert alert-error">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !email || !password}>
            {busy && <LoaderCircle size={17} className="animate-spin" />} Iniciar sesión
          </button>
        </div>
      </form>
    </Screen>
  );
}

// Primera puesta en marcha: crea la cuenta del administrador (solo se muestra mientras no exista ninguno).
function Setup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    setBusy(true);
    try {
      await staffAdmin({ action: "bootstrap", name: name.trim(), email: email.trim(), password });
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <form className="card mx-auto max-w-lg" onSubmit={submit}>
        <span className="badge badge-amber">Primera puesta en marcha</span>
        <h1 className="page-title mt-3">Crea la cuenta de administrador</h1>
        <p className="page-sub mt-1 mb-6">
          Todavía no hay ningún administrador. La primera cuenta que se cree aquí controla toda la aplicación: preguntas,
          instructores y ajustes. Después este formulario desaparece.
        </p>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="su-name">
              Nombre completo
            </label>
            <input id="su-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="su-email">
              Email
            </label>
            <input id="su-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="su-pass">
              Contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="su-pass"
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="alert alert-error">{error}</p>}
          <button className="btn btn-primary w-full" disabled={busy || !name || !email || !password}>
            {busy && <LoaderCircle size={17} className="animate-spin" />} Crear administrador y entrar
          </button>
        </div>
      </form>
    </Screen>
  );
}

function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function change() {
    if (password.length < 8) return setMsg({ ok: false, text: "Mínimo 8 caracteres." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg({ ok: false, text: "No se pudo cambiar. Prueba con otra contraseña." });
    else {
      setMsg({ ok: true, text: "Contraseña cambiada." });
      setPassword("");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-outline btn-sm" onClick={() => (setOpen(true), setMsg(null))}>
        <KeyRound size={14} /> Cambiar contraseña
      </button>
      <button className="btn btn-outline btn-sm text-red" onClick={() => supabase.auth.signOut()}>
        <LogOut size={14} /> Cerrar sesión
      </button>
      <Dialog
        open={open}
        title="Cambiar contraseña"
        tone="primary"
        confirmLabel="Guardar"
        cancelLabel="Cerrar"
        busy={busy}
        onConfirm={change}
        onCancel={() => setOpen(false)}
      >
        <input
          className="input mt-3"
          type="password"
          autoComplete="new-password"
          placeholder="Nueva contraseña"
          aria-label="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {msg && <p className={`alert mt-3 ${msg.ok ? "alert-ok" : "alert-error"}`}>{msg.text}</p>}
      </Dialog>
    </div>
  );
}

