import type { Session } from "@supabase/supabase-js";
import { AnimatePresence } from "motion/react";
import { BarChart3, ClipboardList, ExternalLink, History, KeyRound, ListChecks, LoaderCircle, LogOut, MapPin, Menu, Settings, UserCheck, Users, X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Dialog } from "../components/Dialog";
import { Logo } from "../components/Logo";
import { Screen } from "../components/Screen";
import { ThemeToggle } from "../components/ThemeToggle";
import { api, errorMessage, staffAdmin, type Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useTitle } from "../lib/useTitle";
import { AdminTabs, type AdminTab } from "./AdminTabs";
import { ExamTab } from "./ExamTab";
import { HistoryTab } from "./HistoryTab";
import { StatsTab } from "./StatsTab";

type Tab = "exam" | "history" | "stats" | AdminTab;

const EXAM_NAV = [
  { id: "exam", label: "Examen en sala", icon: ClipboardList },
  { id: "history", label: "Historial", icon: History },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
] as const;
const ADMIN_NAV = [
  { id: "questions", label: "Preguntas", icon: ListChecks },
  { id: "cities", label: "Ciudades", icon: MapPin },
  { id: "staff", label: "Personal", icon: Users },
  { id: "allowed", label: "Alumnos autorizados", icon: UserCheck },
  { id: "settings", label: "Ajustes", icon: Settings },
] as const;

export default function StaffApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [me, setMe] = useState<Staff | null | undefined>(undefined);
  const [setupNeeded, setSetupNeeded] = useState(false);

  useTitle("Personal");
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

  if (session === undefined || (session && me === undefined))
    return (
      <div className="grid min-h-dvh place-items-center text-muted">
        <LoaderCircle className="animate-spin" />
      </div>
    );

  if (!session) return <AuthScreen>{setupNeeded ? <Setup onDone={() => setSetupNeeded(false)} /> : <Login />}</AuthScreen>;

  if (!me)
    return (
      <AuthScreen>
        <h1 className="display text-4xl text-ink">Cuenta sin acceso</h1>
        <p className="mt-2 text-[15px] text-ink2">Esta cuenta no forma parte del personal de ESSA. Pide a un administrador que te dé de alta.</p>
        <button className="btn btn-secondary mt-6" onClick={() => supabase.auth.signOut()}>
          Cerrar sesión
        </button>
      </AuthScreen>
    );

  return <Workspace me={me} />;
}

function Workspace({ me }: { me: Staff }) {
  const [tab, setTab] = useState<Tab>("exam");
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = me.role === "admin";

  const go = (t: Tab) => {
    setTab(t);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const nav = (
    <nav className="flex flex-col gap-6" aria-label="Secciones">
      <NavGroup label="Exámenes" items={EXAM_NAV} tab={tab} go={go} />
      {isAdmin && <NavGroup label="Administración" items={ADMIN_NAV} tab={tab} go={go} />}
      <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-md px-3 py-2 text-[15px] font-medium text-ink2 hover:bg-sunken hover:text-ink">
        <ExternalLink size={18} strokeWidth={1.75} /> Página de alumnos
      </a>
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      {/* Barra lateral (escritorio) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="border-b border-line px-5 py-4">
          <Logo className="h-9" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">{nav}</div>
        <UserBox me={me} />
      </aside>

      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo className="h-8" />
        <button className="btn btn-ghost btn-sm px-2" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} aria-label="Menú">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>
      {menuOpen && (
        <div className="fixed inset-x-0 top-14 bottom-0 z-20 flex flex-col bg-surface lg:hidden">
          <div className="flex-1 overflow-y-auto px-3 py-5">{nav}</div>
          <UserBox me={me} />
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-[1120px]">
          <AnimatePresence mode="wait">
            {tab === "exam" && <ExamTab key="exam" me={me} />}
            {tab === "history" && <HistoryTab key="history" me={me} />}
            {tab === "stats" && <StatsTab key="stats" />}
            {isAdmin && ADMIN_NAV.some((n) => n.id === tab) && <AdminTabs key={tab} tab={tab as AdminTab} me={me} />}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavGroup({
  label,
  items,
  tab,
  go,
}: {
  label: string;
  items: readonly { id: string; label: string; icon: typeof ClipboardList }[];
  tab: Tab;
  go: (t: Tab) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-1.5 px-3">{label}</p>
      <ul className="space-y-0.5">
        {items.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <li key={id}>
              <button
                onClick={() => go(id as Tab)}
                aria-current={active ? "page" : undefined}
                className={`relative flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-[15px] font-medium transition-colors ${
                  active ? "bg-navy-soft text-navy" : "text-ink2 hover:bg-sunken hover:text-ink"
                }`}
              >
                {active && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r bg-red" />}
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UserBox({ me }: { me: Staff }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function change() {
    if (password.length < 8) return setMsg({ ok: false, text: "Mínimo 8 caracteres." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg({ ok: false, text: "No se ha podido cambiar. Prueba con otra contraseña." });
    else {
      setMsg({ ok: true, text: "Contraseña cambiada." });
      setPassword("");
    }
  }

  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center justify-between gap-2 py-1 pr-1 pl-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{me.name}</p>
          <p className="truncate text-sm text-muted">{me.role === "admin" ? "Administrador" : "Instructor"}</p>
        </div>
        <ThemeToggle />
      </div>
      <div className="mt-1 grid grid-cols-2 gap-1">
        <button className="btn btn-ghost btn-sm justify-start" onClick={() => (setOpen(true), setMsg(null))}>
          <KeyRound size={15} /> Contraseña
        </button>
        <button className="btn btn-ghost btn-sm justify-start" onClick={() => supabase.auth.signOut()}>
          <LogOut size={15} /> Salir
        </button>
      </div>
      <Dialog open={open} title="Cambiar contraseña" tone="primary" confirmLabel="Guardar" cancelLabel="Cerrar" busy={busy} onConfirm={change} onCancel={() => setOpen(false)}>
        <label className="field-label mt-3" htmlFor="new-pass">
          Nueva contraseña
        </label>
        <input id="new-pass" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="field-help">Al menos 8 caracteres.</p>
        {msg && <p className={`note mt-3 ${msg.ok ? "note-ok" : "note-error"}`}>{msg.text}</p>}
      </Dialog>
    </div>
  );
}

// Pantalla partida: a la izquierda la marca, a la derecha el formulario.
function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0f2547] p-12 text-white lg:flex">
        <div className="inline-flex w-fit rounded bg-white px-3 py-2">
          <Logo className="h-10" />
        </div>
        <div>
          <p className="display text-6xl leading-[0.95]">
            Panel del
            <br />
            personal docente
          </p>
          <p className="mt-4 max-w-md text-[17px] text-white/70">Abre exámenes por ciudad, sigue a los alumnos en directo y consulta su historial.</p>
        </div>
        <p className="text-sm text-white/50">Escuela de Salvamento y Socorrismo Acuático</p>
        <svg className="pointer-events-none absolute right-0 bottom-28 left-0 h-16 w-full opacity-30" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,30 L250,30 L262,30 L270,8 L280,52 L290,30 L600,30" fill="none" stroke="#f2574f" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="flex flex-col bg-surface">
        <div className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <span className="lg:hidden">
            <Logo className="h-9" />
          </span>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center px-6 pb-16 sm:px-12">
          <div className="w-full max-w-sm">
            <Screen>{children}</Screen>
          </div>
        </div>
        <div className="px-6 pb-6 text-sm text-muted sm:px-12">
          <Link to="/" className="hover:text-ink">
            ← Volver al acceso de alumnos
          </Link>
        </div>
      </div>
    </div>
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
    if (!email.trim() || !password) return setError("Escribe tu email y tu contraseña.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(/fetch/i.test(error.message) ? "Sin conexión. Inténtalo de nuevo." : "El email o la contraseña no son correctos.");
  }

  return (
    <form onSubmit={submit}>
      <h1 className="display text-4xl text-ink">Iniciar sesión</h1>
      <p className="mt-2 text-[15px] text-ink2">Instructores y administradores de ESSA.</p>
      <div className="mt-8 space-y-4">
        <div>
          <label className="field-label" htmlFor="lg-email">
            Email
          </label>
          <input id="lg-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="lg-pass">
            Contraseña
          </label>
          <input id="lg-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="note note-error">{error}</p>}
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy && <LoaderCircle size={17} className="animate-spin" />} Entrar
        </button>
        <p className="text-sm text-muted">¿Has olvidado la contraseña? Pide a un administrador que te asigne una nueva.</p>
      </div>
    </form>
  );
}

// Primera puesta en marcha: crea la cuenta del administrador (solo mientras no exista ninguno).
function Setup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2 || !email.trim()) return setError("Escribe tu nombre y tu email.");
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
    <form onSubmit={submit}>
      <p className="eyebrow">Primera puesta en marcha</p>
      <h1 className="display mt-2 text-4xl text-ink">Crea la cuenta de administrador</h1>
      <p className="mt-2 text-[15px] text-ink2">
        Aún no hay ningún administrador. Esta cuenta controlará preguntas, instructores y ajustes. Después este formulario desaparece.
      </p>
      <div className="mt-8 space-y-4">
        <div>
          <label className="field-label" htmlFor="su-name">
            Nombre y apellidos
          </label>
          <input id="su-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="su-email">
            Email
          </label>
          <input id="su-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="su-pass">
            Contraseña
          </label>
          <input id="su-pass" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="field-help">Al menos 8 caracteres.</p>
        </div>
        {error && <p className="note note-error">{error}</p>}
        <button className="btn btn-primary btn-lg w-full" disabled={busy}>
          {busy && <LoaderCircle size={17} className="animate-spin" />} Crear y entrar
        </button>
      </div>
    </form>
  );
}
