import { KeyRound, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Dialog } from "../components/Dialog";
import { Screen } from "../components/Screen";
import { check, errorMessage, staffAdmin, type AllowedStudent, type Question, type Settings, type Staff } from "../lib/api";
import { supabase } from "../lib/supabase";

export type AdminTab = "questions" | "cities" | "staff" | "allowed" | "settings";

export function AdminTabs({ tab, me }: { tab: AdminTab; me: Staff }) {
  return (
    <Screen>
      {tab === "questions" && <QuestionsTab />}
      {tab === "cities" && <CitiesTab />}
      {tab === "staff" && <StaffTab me={me} />}
      {tab === "allowed" && <AllowedTab />}
      {tab === "settings" && <SettingsTab />}
    </Screen>
  );
}

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role={msg.ok ? "status" : "alert"}>
      {msg.text}
    </p>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-16 text-muted">
      <LoaderCircle className="animate-spin" />
    </div>
  );
}

function Header({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h2 className="section-title">{title}</h2>
      {children && <p className="mt-1 text-sm text-muted">{children}</p>}
    </div>
  );
}

// ── Preguntas ─────────────────────────────────────────────────────────────
type Draft = Omit<Question, "id"> & { id: string; isNew?: boolean };

function QuestionsTab() {
  const [saved, setSaved] = useState<Question[] | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = check(await supabase.from("questions").select("*").order("position").order("created_at")) as Question[];
    setSaved(data);
    setDrafts(data.map((q) => ({ ...q, options: [...q.options] })));
  }, []);

  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: errorMessage(e) }));
  }, [load]);

  const update = (i: number, patch: Partial<Draft>) => setDrafts((d) => d.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  function add() {
    setDrafts((d) => [
      ...d,
      { id: crypto.randomUUID(), isNew: true, position: d.length + 1, question: "", options: ["", "", "", ""], correct: 0, explanation: "" },
    ]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 50);
  }

  async function saveAll() {
    setMsg(null);
    const bad = drafts.findIndex((q) => q.question.trim().length < 3 || q.options.some((o) => !o.trim()));
    if (bad !== -1) return setMsg({ ok: false, text: `Revisa la pregunta ${bad + 1}: falta el enunciado o alguna opción.` });
    setBusy(true);
    try {
      const keep = new Set(drafts.map((q) => q.id));
      const removed = (saved ?? []).filter((q) => !keep.has(q.id)).map((q) => q.id);
      if (removed.length) check(await supabase.from("questions").delete().in("id", removed));
      const rows = drafts.map((q, i) => ({
        id: q.id,
        position: i + 1,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correct: q.correct,
        explanation: q.explanation?.trim() || null,
      }));
      if (rows.length) check(await supabase.from("questions").upsert(rows));
      await load();
      setMsg({ ok: true, text: "Preguntas guardadas. Se usarán en el próximo examen que empiece." });
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  if (!saved) return <Loading />;
  const dirty = JSON.stringify(saved.map(strip)) !== JSON.stringify(drafts.map(strip));

  return (
    <div className="space-y-5">
      <Header title={`Preguntas del examen (${drafts.length})`}>
        Marca la opción correcta de cada pregunta. Los alumnos nunca reciben cuál es la correcta hasta que entregan.
      </Header>

      <ol className="space-y-4">
        {drafts.map((q, i) => (
          <li key={q.id} className="panel space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide text-muted uppercase">Pregunta {i + 1}</span>
              <button className="btn btn-outline btn-sm text-red" onClick={() => setDrafts((d) => d.filter((_, j) => j !== i))}>
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
            <div>
              <label className="label" htmlFor={`q-${q.id}`}>
                Enunciado
              </label>
              <textarea
                id={`q-${q.id}`}
                className="input min-h-16"
                value={q.question}
                onChange={(e) => update(i, { question: e.target.value })}
                placeholder="Escribe la pregunta"
              />
            </div>
            <fieldset>
              <legend className="label">Opciones (marca la correcta)</legend>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correct === oi}
                      onChange={() => update(i, { correct: oi })}
                      className="h-4 w-4 shrink-0 accent-[var(--green)]"
                      aria-label={`Marcar opción ${oi + 1} como correcta`}
                    />
                    <input
                      className={`input py-2 ${q.correct === oi ? "border-green" : ""}`}
                      value={opt}
                      placeholder={`Opción ${oi + 1}`}
                      aria-label={`Opción ${oi + 1}`}
                      onChange={(e) => update(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                    />
                    {q.options.length > 2 && (
                      <button
                        className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:text-red"
                        aria-label={`Quitar opción ${oi + 1}`}
                        onClick={() =>
                          update(i, {
                            options: q.options.filter((_, k) => k !== oi),
                            correct: q.correct === oi ? 0 : q.correct > oi ? q.correct - 1 : q.correct,
                          })
                        }
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {q.options.length < 6 && (
                <button className="mt-2 cursor-pointer text-xs font-bold text-navy-mid" onClick={() => update(i, { options: [...q.options, ""] })}>
                  + Añadir opción
                </button>
              )}
            </fieldset>
            <div>
              <label className="label" htmlFor={`e-${q.id}`}>
                Explicación (opcional)
              </label>
              <input
                id={`e-${q.id}`}
                className="input py-2 text-sm"
                value={q.explanation ?? ""}
                onChange={(e) => update(i, { explanation: e.target.value })}
                placeholder="Por qué es la correcta"
              />
            </div>
          </li>
        ))}
      </ol>

      <button className="btn btn-outline w-full" onClick={add}>
        <Plus size={16} /> Añadir pregunta
      </button>

      <Feedback msg={msg} />
      <div className="sticky bottom-3 z-10 flex gap-2 rounded-2xl border border-line bg-paper/90 p-2 backdrop-blur">
        <button className="btn btn-primary flex-1" onClick={saveAll} disabled={busy || !dirty}>
          {busy && <LoaderCircle size={16} className="animate-spin" />} {dirty ? "Guardar cambios" : "Sin cambios"}
        </button>
        <button className="btn btn-outline" disabled={!dirty || busy} onClick={() => setDrafts(saved.map((q) => ({ ...q, options: [...q.options] })))}>
          Descartar
        </button>
      </div>
    </div>
  );
}

const strip = (q: Partial<Draft>) => ({ id: q.id, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation || null });

// ── Ciudades ──────────────────────────────────────────────────────────────
function CitiesTab() {
  const [cities, setCities] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = check(await supabase.from("cities").select("name").order("name")) as { name: string }[];
    setCities(data.map((c) => c.name));
  }, []);
  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: errorMessage(e) }));
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) return setMsg({ ok: false, text: "Escribe el nombre de la ciudad o municipio." });
    if (cities?.some((c) => c.toLowerCase() === n.toLowerCase())) return setMsg({ ok: false, text: "Esa ciudad ya está registrada." });
    const res = await supabase.from("cities").insert({ name: n });
    if (res.error) return setMsg({ ok: false, text: "No se pudo añadir la ciudad." });
    setName("");
    setMsg({ ok: true, text: `«${n}» añadida.` });
    load();
  }

  async function remove(c: string) {
    setToDelete(null);
    const res = await supabase.from("cities").delete().eq("name", c);
    setMsg(res.error ? { ok: false, text: "No se pudo eliminar." } : { ok: true, text: `«${c}» eliminada. Su historial se conserva.` });
    load();
  }

  if (!cities) return <Loading />;
  return (
    <div className="space-y-5">
      <Header title={`Ciudades y municipios (${cities.length})`}>Son las que aparecen al alumno y al abrir un examen.</Header>
      <form className="flex gap-2" onSubmit={add}>
        <input className="input" placeholder="Ej. Lepe" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nueva ciudad" />
        <button className="btn btn-success shrink-0">
          <Plus size={16} /> Añadir
        </button>
      </form>
      <Feedback msg={msg} />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <li key={c} className="flex items-center justify-between rounded-xl border border-line bg-bg px-4 py-2.5">
            <span className="font-semibold text-ink">{c}</span>
            <button className="cursor-pointer p-1 text-muted hover:text-red" aria-label={`Eliminar ${c}`} onClick={() => setToDelete(c)}>
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={!!toDelete} title={`¿Eliminar «${toDelete}»?`} confirmLabel="Eliminar" onCancel={() => setToDelete(null)} onConfirm={() => toDelete && remove(toDelete)}>
        Dejará de aparecer para nuevos exámenes. Los resultados ya guardados no se borran.
      </Dialog>
    </div>
  );
}

// ── Personal (instructores y administradores) ─────────────────────────────
function StaffTab({ me }: { me: Staff }) {
  const [list, setList] = useState<Staff[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "instructor" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Staff | null>(null);
  const [resetFor, setResetFor] = useState<Staff | null>(null);
  const [newPass, setNewPass] = useState("");

  const load = useCallback(async () => {
    setList(check(await supabase.from("staff").select("*").order("role").order("name")) as Staff[]);
  }, []);
  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: errorMessage(e) }));
  }, [load]);

  async function act(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, text: ok });
      await load();
      return true;
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    const done = await act(
      () => staffAdmin({ action: "create", ...form, name: form.name.trim(), email: form.email.trim() }),
      `Cuenta creada para ${form.name.trim()}. Pásale su email y contraseña; podrá cambiarla al entrar.`,
    );
    if (done) setForm({ name: "", email: "", password: "", role: "instructor" });
  }

  if (!list) return <Loading />;
  return (
    <div className="space-y-6">
      <Header title="Añadir cuenta">Cada instructor entra con su email y contraseña. Solo ve el panel de examen, historial y estadísticas.</Header>
      <form className="panel grid gap-3 sm:grid-cols-2" onSubmit={create}>
        <div>
          <label className="label" htmlFor="sf-name">
            Nombre completo
          </label>
          <input id="sf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Pedro García" />
        </div>
        <div>
          <label className="label" htmlFor="sf-email">
            Email
          </label>
          <input id="sf-email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="sf-pass">
            Contraseña inicial (mín. 8)
          </label>
          <input id="sf-pass" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" />
        </div>
        <div>
          <label className="label" htmlFor="sf-role">
            Rol
          </label>
          <select id="sf-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="instructor">Instructor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button className="btn btn-success sm:col-span-2" disabled={busy || !form.name || !form.email || form.password.length < 8}>
          {busy && <LoaderCircle size={16} className="animate-spin" />}
          <Plus size={16} /> Crear cuenta
        </button>
      </form>
      <Feedback msg={msg} />

      <div>
        <h3 className="section-title mb-3">Equipo ({list.length})</h3>
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  {s.name}
                  <span className={`badge ${s.role === "admin" ? "badge-navy" : "badge-muted"}`}>{s.role === "admin" ? "Administrador" : "Instructor"}</span>
                  {s.user_id === me.user_id && <span className="badge badge-green">Tú</span>}
                </div>
                <div className="truncate text-xs text-muted">{s.email}</div>
              </div>
              {s.user_id !== me.user_id && (
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-sm" onClick={() => (setResetFor(s), setNewPass(""))}>
                    <KeyRound size={13} /> Contraseña
                  </button>
                  <button className="btn btn-outline btn-sm text-red" onClick={() => setToDelete(s)}>
                    <Trash2 size={13} /> Eliminar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <Dialog
        open={!!toDelete}
        title={`¿Eliminar a ${toDelete?.name}?`}
        confirmLabel="Eliminar cuenta"
        busy={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const s = toDelete!;
          setToDelete(null);
          act(() => staffAdmin({ action: "delete", user_id: s.user_id }), `Cuenta de ${s.name} eliminada. Sus exámenes se conservan en el historial.`);
        }}
      >
        Ya no podrá entrar al panel. Los exámenes que dirigió se conservan.
      </Dialog>

      <Dialog
        open={!!resetFor}
        title={`Nueva contraseña para ${resetFor?.name}`}
        tone="primary"
        confirmLabel="Cambiar contraseña"
        busy={busy}
        onCancel={() => setResetFor(null)}
        onConfirm={() => {
          if (newPass.length < 8) return;
          const s = resetFor!;
          setResetFor(null);
          act(() => staffAdmin({ action: "reset_password", user_id: s.user_id, password: newPass }), `Contraseña de ${s.name} cambiada.`);
        }}
      >
        <input
          className="input mt-3"
          placeholder="Mínimo 8 caracteres"
          aria-label="Nueva contraseña"
          value={newPass}
          autoComplete="off"
          onChange={(e) => setNewPass(e.target.value)}
        />
      </Dialog>
    </div>
  );
}

// ── Alumnos autorizados (lista blanca) ────────────────────────────────────
function AllowedTab() {
  const [list, setList] = useState<AllowedStudent[] | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setList(check(await supabase.from("allowed_students").select("*").order("created_at", { ascending: false })) as AllowedStudent[]);
  }, []);
  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: errorMessage(e) }));
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return setMsg({ ok: false, text: "El email no es válido." });
    const res = await supabase.from("allowed_students").upsert({ email: em, name: name.trim() || null });
    if (res.error) return setMsg({ ok: false, text: "No se pudo añadir." });
    setEmail("");
    setName("");
    setMsg({ ok: true, text: `${em} autorizado.` });
    load();
  }

  async function revoke(em: string) {
    await supabase.from("allowed_students").delete().eq("email", em);
    load();
  }

  if (!list) return <Loading />;
  return (
    <div className="space-y-5">
      <Header title="Alumnos autorizados">
        Si la lista está vacía, cualquiera con el PIN puede hacer el examen. En cuanto añadas un email, se pedirá el email al alumno y solo
        entrarán los de la lista.
      </Header>
      <div className={`alert ${list.length ? "alert-info" : "alert-warn"}`}>
        {list.length ? `Acceso restringido: ${list.length} alumnos autorizados.` : "Acceso libre: basta con el PIN."}
      </div>
      <form className="panel grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={add}>
        <input className="input" type="email" placeholder="alumno@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email del alumno" />
        <input className="input" placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del alumno" />
        <button className="btn btn-success">
          <Plus size={16} /> Autorizar
        </button>
      </form>
      <Feedback msg={msg} />
      <ul className="space-y-2">
        {list.map((a) => (
          <li key={a.email} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-bg px-4 py-2.5">
            <div className="min-w-0">
              <div className="truncate font-semibold text-ink">{a.name || a.email}</div>
              {a.name && <div className="truncate text-xs text-muted">{a.email}</div>}
            </div>
            <button className="btn btn-outline btn-sm text-red" onClick={() => revoke(a.email)}>
              Revocar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Ajustes ───────────────────────────────────────────────────────────────
function SettingsTab() {
  const [cfg, setCfg] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then((r) => (r.error ? setMsg({ ok: false, text: "No se pudieron cargar los ajustes." }) : setCfg(r.data as Settings)));
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!cfg) return;
    setBusy(true);
    setMsg(null);
    const { id, ...rest } = cfg;
    const res = await supabase
      .from("settings")
      .update({ ...rest, google_review_url: rest.google_review_url?.trim() || null, exam_title: rest.exam_title.trim() })
      .eq("id", id);
    setBusy(false);
    setMsg(res.error ? { ok: false, text: "Revisa los valores: alguno está fuera de rango." } : { ok: true, text: "Ajustes guardados." });
  }

  if (!cfg) return msg ? <Feedback msg={msg} /> : <Loading />;
  const set = (patch: Partial<Settings>) => setCfg({ ...cfg, ...patch });

  return (
    <form className="space-y-5" onSubmit={save}>
      <Header title="Ajustes del examen" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="cf-title">
            Nombre de la evaluación
          </label>
          <input id="cf-title" className="input" value={cfg.exam_title} maxLength={80} onChange={(e) => set({ exam_title: e.target.value })} />
          <p className="mt-1 text-xs text-muted">Aparece en la pantalla del alumno: «Evaluación {cfg.exam_title.toUpperCase()}».</p>
        </div>
        <div>
          <label className="label" htmlFor="cf-qpa">
            Preguntas por examen
          </label>
          <input
            id="cf-qpa"
            className="input"
            type="number"
            min={1}
            placeholder="Todas"
            value={cfg.questions_per_attempt ?? ""}
            onChange={(e) => set({ questions_per_attempt: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
          />
          <p className="mt-1 text-xs text-muted">Vacío para usar todas. Si pones menos, cada alumno recibe una selección.</p>
        </div>
        <div>
          <label className="label" htmlFor="cf-pass">
            Nota mínima para aprobar (%)
          </label>
          <input id="cf-pass" className="input" type="number" min={1} max={100} value={cfg.pass_threshold} onChange={(e) => set({ pass_threshold: Number(e.target.value) })} />
        </div>
        <div>
          <label className="label" htmlFor="cf-min">
            Duración por defecto (minutos)
          </label>
          <input id="cf-min" className="input" type="number" min={1} max={180} value={cfg.exam_minutes} onChange={(e) => set({ exam_minutes: Number(e.target.value) })} />
          <p className="mt-1 text-xs text-muted">El instructor puede cambiarla al iniciar cada examen.</p>
        </div>
        <div>
          <label className="label" htmlFor="cf-rev">
            Pedir reseña en Google a partir de
          </label>
          <select id="cf-rev" className="input" value={cfg.review_threshold} onChange={(e) => set({ review_threshold: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "estrella" : "estrellas"}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="cf-url">
            Enlace de reseñas de Google
          </label>
          <input id="cf-url" className="input" type="url" value={cfg.google_review_url ?? ""} onChange={(e) => set({ google_review_url: e.target.value })} />
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--navy-mid)]" checked={cfg.random_order} onChange={(e) => set({ random_order: e.target.checked })} />
          Mezclar el orden de las preguntas para cada alumno
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink2">
          <input type="checkbox" className="h-4 w-4 accent-[var(--navy-mid)]" checked={cfg.show_breakdown} onChange={(e) => set({ show_breakdown: e.target.checked })} />
          Mostrar al alumno las correcciones detalladas al terminar
        </label>
      </div>

      <Feedback msg={msg} />
      <button className="btn btn-primary w-full" disabled={busy}>
        {busy && <LoaderCircle size={16} className="animate-spin" />} Guardar ajustes
      </button>
    </form>
  );
}
