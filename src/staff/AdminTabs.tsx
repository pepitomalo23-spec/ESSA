import { ArrowDown, ArrowUp, ChevronDown, KeyRound, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Dialog } from "../components/Dialog";
import { check, errorMessage, staffAdmin, type AllowedStudent, type Question, type Settings, type Staff } from "../lib/api";
import { supabase } from "../lib/supabase";
import { Empty, Feedback, Loading, Page } from "./Page";

export type AdminTab = "questions" | "cities" | "staff" | "allowed" | "settings";

export function AdminTabs({ tab, me }: { tab: AdminTab; me: Staff }) {
  switch (tab) {
    case "questions":
      return <QuestionsTab />;
    case "cities":
      return <CitiesTab />;
    case "staff":
      return <StaffTab me={me} />;
    case "allowed":
      return <AllowedTab />;
    case "settings":
      return <SettingsTab />;
  }
}

type Msg = { ok: boolean; text: string } | null;

// ── Preguntas ─────────────────────────────────────────────────────────────
type Draft = Omit<Question, "id"> & { id: string };
const strip = (q: Partial<Draft>) => ({ id: q.id, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation || null });

function QuestionsTab() {
  const [saved, setSaved] = useState<Question[] | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
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

  const move = (i: number, dir: -1 | 1) =>
    setDrafts((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.length) return d;
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  function add() {
    const id = crypto.randomUUID();
    setDrafts((d) => [...d, { id, position: d.length + 1, question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]);
    setOpen(id);
  }

  async function saveAll() {
    setMsg(null);
    const bad = drafts.findIndex((q) => q.question.trim().length < 3 || q.options.some((o) => !o.trim()));
    if (bad !== -1) {
      setOpen(drafts[bad].id);
      return setMsg({ ok: false, text: `A la pregunta ${bad + 1} le falta el enunciado o alguna opción.` });
    }
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
      setMsg({ ok: true, text: "Cambios guardados. Se aplican a los exámenes que empiecen a partir de ahora." });
    } catch (e) {
      setMsg({ ok: false, text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  if (!saved) return <Loading />;
  const dirty = JSON.stringify(saved.map(strip)) !== JSON.stringify(drafts.map(strip));

  return (
    <Page
      title="Preguntas"
      description="Banco de preguntas del examen. El alumno no recibe la respuesta correcta hasta que entrega."
      actions={
        <button className="btn btn-secondary btn-sm" onClick={add}>
          <Plus size={15} /> Nueva pregunta
        </button>
      }
    >
      <div className="sheet divide-y divide-line">
        {drafts.length === 0 && <p className="px-6 py-10 text-center text-muted">No hay preguntas. Añade la primera.</p>}
        {drafts.map((q, i) => {
          const expanded = open === q.id;
          return (
            <div key={q.id}>
              <button
                className="flex w-full cursor-pointer items-start gap-4 px-5 py-4 text-left hover:bg-sunken"
                onClick={() => setOpen(expanded ? null : q.id)}
                aria-expanded={expanded}
              >
                <span className="display tnum w-7 shrink-0 pt-0.5 text-lg text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-medium ${q.question ? "text-ink" : "text-muted italic"}`}>{q.question || "Pregunta sin enunciado"}</span>
                  {!expanded && q.options[q.correct] && <span className="mt-0.5 block truncate text-sm text-green">✓ {q.options[q.correct]}</span>}
                </span>
                <ChevronDown size={18} className={`mt-1 shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>

              {expanded && (
                <div className="space-y-5 border-t border-line bg-sunken px-5 py-5 sm:pl-16">
                  <div>
                    <label className="field-label" htmlFor={`q-${q.id}`}>
                      Enunciado
                    </label>
                    <textarea id={`q-${q.id}`} className="input min-h-20" value={q.question} onChange={(e) => update(i, { question: e.target.value })} />
                  </div>
                  <fieldset>
                    <legend className="field-label">Respuestas · marca la correcta</legend>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correct === oi}
                              onChange={() => update(i, { correct: oi })}
                              className="h-4 w-4 accent-[var(--green)]"
                              aria-label={`La respuesta ${String.fromCharCode(65 + oi)} es la correcta`}
                            />
                          </label>
                          <input
                            className={`input ${q.correct === oi ? "border-green" : ""}`}
                            value={opt}
                            placeholder={`Respuesta ${String.fromCharCode(65 + oi)}`}
                            aria-label={`Respuesta ${String.fromCharCode(65 + oi)}`}
                            onChange={(e) => update(i, { options: q.options.map((o, k) => (k === oi ? e.target.value : o)) })}
                          />
                          <button
                            className="btn btn-ghost btn-sm px-2"
                            disabled={q.options.length <= 2}
                            aria-label={`Quitar respuesta ${String.fromCharCode(65 + oi)}`}
                            onClick={() => update(i, { options: q.options.filter((_, k) => k !== oi), correct: q.correct === oi ? 0 : q.correct > oi ? q.correct - 1 : q.correct })}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {q.options.length < 6 && (
                      <button className="btn btn-ghost btn-sm mt-2" onClick={() => update(i, { options: [...q.options, ""] })}>
                        <Plus size={15} /> Añadir respuesta
                      </button>
                    )}
                  </fieldset>
                  <div>
                    <label className="field-label" htmlFor={`e-${q.id}`}>
                      Explicación <span className="font-normal text-muted">(la ve el alumno al corregir)</span>
                    </label>
                    <input id={`e-${q.id}`} className="input" value={q.explanation ?? ""} onChange={(e) => update(i, { explanation: e.target.value })} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => move(i, -1)}>
                        <ArrowUp size={15} /> Subir
                      </button>
                      <button className="btn btn-ghost btn-sm" disabled={i === drafts.length - 1} onClick={() => move(i, 1)}>
                        <ArrowDown size={15} /> Bajar
                      </button>
                    </div>
                    <button className="btn btn-danger-ghost btn-sm" onClick={() => setDrafts((d) => d.filter((_, j) => j !== i))}>
                      <Trash2 size={15} /> Eliminar pregunta
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Feedback msg={msg} />
      </div>

      {dirty && (
        <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-lg border border-line-strong bg-surface px-4 py-3 shadow-[0_12px_30px_-12px_rgb(13_27_46/0.35)]">
          <span className="text-[15px] font-medium text-ink">Tienes cambios sin guardar.</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setDrafts(saved.map((q) => ({ ...q, options: [...q.options] })))}>
              Descartar
            </button>
            <button className="btn btn-primary btn-sm" onClick={saveAll} disabled={busy}>
              {busy && <LoaderCircle size={15} className="animate-spin" />} Guardar cambios
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}

// ── Ciudades ──────────────────────────────────────────────────────────────
function CitiesTab() {
  const [cities, setCities] = useState<string[] | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
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
    if (cities?.some((c) => c.toLowerCase() === n.toLowerCase())) return setMsg({ ok: false, text: "Esa ciudad ya está en la lista." });
    const res = await supabase.from("cities").insert({ name: n });
    if (res.error) return setMsg({ ok: false, text: "No se ha podido añadir." });
    setName("");
    setMsg({ ok: true, text: `${n} añadida.` });
    load();
  }

  async function remove(c: string) {
    setToDelete(null);
    const res = await supabase.from("cities").delete().eq("name", c);
    setMsg(res.error ? { ok: false, text: "No se ha podido eliminar." } : { ok: true, text: `${c} eliminada. Su historial se conserva.` });
    load();
  }

  if (!cities) return <Loading />;
  return (
    <Page title="Ciudades" description="Municipios donde se imparten cursos. Aparecen al alumno y al abrir una sala.">
      <form className="mb-5 flex max-w-lg gap-2" onSubmit={add}>
        <input className="input" placeholder="Nombre del municipio" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nueva ciudad" />
        <button className="btn btn-primary shrink-0">Añadir</button>
      </form>
      <div className="mb-5">
        <Feedback msg={msg} />
      </div>
      <div className="sheet max-w-lg divide-y divide-line">
        {cities.map((c) => (
          <div key={c} className="flex items-center justify-between px-5 py-2.5">
            <span className="font-medium text-ink">{c}</span>
            <button className="btn btn-ghost btn-sm px-2 text-muted hover:text-red" aria-label={`Eliminar ${c}`} onClick={() => setToDelete(c)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <Dialog open={!!toDelete} title={`¿Eliminar ${toDelete}?`} confirmLabel="Eliminar" onCancel={() => setToDelete(null)} onConfirm={() => toDelete && remove(toDelete)}>
        Dejará de aparecer para nuevos exámenes. Los resultados guardados no se borran.
      </Dialog>
    </Page>
  );
}

// ── Personal ──────────────────────────────────────────────────────────────
function StaffTab({ me }: { me: Staff }) {
  const [list, setList] = useState<Staff[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "instructor" });
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
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
      `Cuenta creada para ${form.name.trim()}. Envíale su email y contraseña; podrá cambiarla al entrar.`,
    );
    if (done) {
      setForm({ name: "", email: "", password: "", role: "instructor" });
      setShowForm(false);
    }
  }

  if (!list) return <Loading />;
  return (
    <Page
      title="Personal"
      description="Instructores y administradores. Un instructor ve la sala, el historial y las estadísticas; un administrador, además, esta sección."
      actions={
        !showForm && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Añadir persona
          </button>
        )
      }
    >
      {showForm && (
        <form className="sheet mb-6 p-5 sm:p-6" onSubmit={create}>
          <h2 className="display text-2xl text-ink">Nueva cuenta</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sf-name">
                Nombre y apellidos
              </label>
              <input id="sf-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="sf-email">
                Email
              </label>
              <input id="sf-email" className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="field-label" htmlFor="sf-pass">
                Contraseña inicial
              </label>
              <input id="sf-pass" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" />
              <p className="field-help">Al menos 8 caracteres.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="sf-role">
                Rol
              </label>
              <select id="sf-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="instructor">Instructor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" disabled={busy || !form.name || !form.email || form.password.length < 8}>
              {busy && <LoaderCircle size={16} className="animate-spin" />} Crear cuenta
            </button>
          </div>
        </form>
      )}
      <div className="mb-5">
        <Feedback msg={msg} />
      </div>

      <div className="sheet overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.user_id}>
                <td className="font-medium text-ink">
                  {s.name} {s.user_id === me.user_id && <span className="ml-1 text-sm font-normal text-muted">(tú)</span>}
                </td>
                <td className="text-ink2">{s.email}</td>
                <td>
                  <span className="tag">{s.role === "admin" ? "Administrador" : "Instructor"}</span>
                </td>
                <td className="text-right whitespace-nowrap">
                  {s.user_id !== me.user_id && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={() => (setResetFor(s), setNewPass(""))}>
                        <KeyRound size={15} /> Contraseña
                      </button>
                      <button className="btn btn-danger-ghost btn-sm" onClick={() => setToDelete(s)}>
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          act(() => staffAdmin({ action: "delete", user_id: s.user_id }), `Cuenta de ${s.name} eliminada. Sus exámenes se conservan.`);
        }}
      >
        No podrá volver a entrar al panel. Los exámenes que dirigió se conservan en el historial.
      </Dialog>

      <Dialog
        open={!!resetFor}
        title="Nueva contraseña"
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
        <p>Para {resetFor?.name}.</p>
        <input className="input mt-3" placeholder="Al menos 8 caracteres" aria-label="Nueva contraseña" value={newPass} autoComplete="off" onChange={(e) => setNewPass(e.target.value)} />
      </Dialog>
    </Page>
  );
}

// ── Alumnos autorizados ───────────────────────────────────────────────────
function AllowedTab() {
  const [list, setList] = useState<AllowedStudent[] | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<Msg>(null);

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
    if (res.error) return setMsg({ ok: false, text: "No se ha podido añadir." });
    setEmail("");
    setName("");
    setMsg({ ok: true, text: `${em} puede hacer el examen.` });
    load();
  }

  async function revoke(em: string) {
    await supabase.from("allowed_students").delete().eq("email", em);
    load();
  }

  if (!list) return <Loading />;
  return (
    <Page
      title="Alumnos autorizados"
      description="Con la lista vacía, cualquiera con el código puede hacer el examen. Si añades algún email, se pedirá al alumno y solo entrarán los de la lista."
    >
      <div className="sheet mb-6 flex items-center gap-3 px-5 py-4">
        <span className={`status ${list.length ? "status-navy" : ""}`}>{list.length ? `Acceso restringido a ${list.length} alumnos` : "Acceso libre con el código"}</span>
      </div>
      <form className="mb-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={add}>
        <input className="input" type="email" placeholder="alumno@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email del alumno" />
        <input className="input" placeholder="Nombre (opcional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del alumno" />
        <button className="btn btn-primary">Autorizar</button>
      </form>
      <div className="mb-5">
        <Feedback msg={msg} />
      </div>
      {list.length === 0 ? (
        <Empty>Nadie en la lista.</Empty>
      ) : (
        <div className="sheet overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.email}>
                  <td className="font-medium text-ink">{a.email}</td>
                  <td className="text-ink2">{a.name ?? "—"}</td>
                  <td className="text-right">
                    <button className="btn btn-danger-ghost btn-sm" onClick={() => revoke(a.email)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}

// ── Ajustes ───────────────────────────────────────────────────────────────
function Row({ title, help, children }: { title: string; help?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-3 px-5 py-5 sm:grid-cols-[1fr_minmax(0,320px)] sm:gap-8 sm:px-6">
      <div>
        <p className="font-semibold text-ink">{title}</p>
        {help && <p className="mt-0.5 text-sm text-muted">{help}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3">
      <span className="relative inline-flex">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line-strong transition-colors peer-checked:bg-navy peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-[15px] text-ink2">{label}</span>
    </label>
  );
}

function SettingsTab() {
  const [cfg, setCfg] = useState<Settings | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then((r) => (r.error ? setMsg({ ok: false, text: "No se han podido cargar los ajustes." }) : setCfg(r.data as Settings)));
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
    setMsg(res.error ? { ok: false, text: "Algún valor está fuera de rango. Revísalo." } : { ok: true, text: "Ajustes guardados." });
  }

  if (!cfg) return msg ? <Feedback msg={msg} /> : <Loading />;
  const set = (patch: Partial<Settings>) => setCfg({ ...cfg, ...patch });

  return (
    <Page title="Ajustes" description="Configuración general del examen.">
      <form onSubmit={save}>
        <div className="sheet divide-y divide-line">
          <Row title="Nombre de la evaluación" help={`El alumno lo ve como «Evaluación · ${cfg.exam_title}».`}>
            <input id="cf-title" aria-label="Nombre de la evaluación" className="input" value={cfg.exam_title} maxLength={80} onChange={(e) => set({ exam_title: e.target.value })} />
          </Row>
          <Row title="Preguntas por examen" help="Déjalo vacío para usar todas. Si pones menos, cada alumno recibe una selección distinta.">
            <input
              id="cf-qpa"
              aria-label="Preguntas por examen"
              className="input tnum w-32"
              type="number"
              min={1}
              placeholder="Todas"
              value={cfg.questions_per_attempt ?? ""}
              onChange={(e) => set({ questions_per_attempt: e.target.value ? Math.max(1, Number(e.target.value)) : null })}
            />
          </Row>
          <Row title="Nota mínima para ser apto">
            <div className="flex items-center gap-2">
              <input id="cf-pass" aria-label="Nota mínima en porcentaje" className="input tnum w-24" type="number" min={1} max={100} value={cfg.pass_threshold} onChange={(e) => set({ pass_threshold: Number(e.target.value) })} />
              <span className="text-ink2">% de aciertos</span>
            </div>
          </Row>
          <Row title="Duración por defecto" help="El instructor puede cambiarla al iniciar cada examen.">
            <div className="flex items-center gap-2">
              <input id="cf-min" aria-label="Duración en minutos" className="input tnum w-24" type="number" min={1} max={180} value={cfg.exam_minutes} onChange={(e) => set({ exam_minutes: Number(e.target.value) })} />
              <span className="text-ink2">minutos</span>
            </div>
          </Row>
          <Row title="Orden de las preguntas">
            <Toggle id="cf-random" checked={cfg.random_order} onChange={(v) => set({ random_order: v })} label="Distinto para cada alumno" />
          </Row>
          <Row title="Corrección al terminar">
            <Toggle id="cf-breakdown" checked={cfg.show_breakdown} onChange={(v) => set({ show_breakdown: v })} label="Mostrar al alumno qué acertó y qué falló" />
          </Row>
          <Row title="Reseña en Google" help="Se invita a dejar reseña a quien valore el curso con esta nota o más.">
            <div className="space-y-2">
              <select id="cf-rev" aria-label="Nota mínima para pedir reseña" className="input" value={cfg.review_threshold} onChange={(e) => set({ review_threshold: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    Desde {n} {n === 1 ? "estrella" : "estrellas"}
                  </option>
                ))}
              </select>
              <input id="cf-url" aria-label="Enlace de reseñas de Google" className="input" type="url" placeholder="https://g.page/r/…" value={cfg.google_review_url ?? ""} onChange={(e) => set({ google_review_url: e.target.value })} />
            </div>
          </Row>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
          <div className="flex-1">
            <Feedback msg={msg} />
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {busy && <LoaderCircle size={16} className="animate-spin" />} Guardar ajustes
          </button>
        </div>
      </form>
    </Page>
  );
}
