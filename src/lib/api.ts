import { supabase } from "./supabase";

// ── Tipos ────────────────────────────────────────────────────────────────
export type PublicInfo = {
  cities: string[];
  open: { city: string; status: "waiting" | "running" }[];
  require_email: boolean;
  setup_needed: boolean;
  exam_title: string;
  review_threshold: number;
  google_review_url: string | null;
  now: string;
};

export type AttemptStatus = "waiting" | "in_progress" | "done" | "left" | "timed_out";
export type SessionStatus = "waiting" | "running" | "closed";

export type AttemptState = {
  attempt_status: AttemptStatus;
  session_status: SessionStatus;
  ends_at: string | null;
  now: string;
  city: string;
  name: string;
  locked: boolean;
};

export type StudentQuestion = { id: string; question: string; options: string[] };

export type StartedAttempt = {
  ends_at: string;
  now: string;
  locked: boolean;
  answers: Record<string, number>;
  questions: StudentQuestion[];
};

export type ResultItem = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  selected: number;
  ok: boolean;
};

export type FinishResult = {
  status: "done" | "left" | "timed_out" | "cancelled";
  score: number;
  total: number;
  pct: number;
  pass: boolean;
  breakdown: ResultItem[] | null;
};

export type Staff = { user_id: string; email: string; name: string; role: "admin" | "instructor"; created_at: string };

export type ExamSession = {
  id: string;
  instructor_id: string | null;
  instructor_name: string;
  city: string;
  pin: string;
  status: SessionStatus;
  duration_minutes: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  closed_at: string | null;
};

export type Attempt = {
  id: string;
  session_id: string;
  name: string;
  email: string | null;
  city: string;
  status: AttemptStatus;
  question_ids: string[] | null;
  answers: Record<string, number>;
  results: ResultItem[] | null;
  score: number | null;
  total: number | null;
  pct: number | null;
  pass: boolean | null;
  exits: number;
  locked: boolean;
  rating: number | null;
  comment: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type Question = {
  id: string;
  position: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
};

export type Settings = {
  id: 1;
  exam_title: string;
  questions_per_attempt: number | null;
  pass_threshold: number;
  random_order: boolean;
  show_breakdown: boolean;
  review_threshold: number;
  exam_minutes: number;
  google_review_url: string | null;
};

export type AllowedStudent = { email: string; name: string | null; created_at: string };

// ── Errores legibles ─────────────────────────────────────────────────────
const MESSAGES: Record<string, string> = {
  NOMBRE: "Escribe tu nombre completo.",
  PIN: "El código de examen no es correcto o la sesión ya está cerrada.",
  NO_AUTORIZADO: "Tu email no está en la lista de alumnos autorizados. Habla con tu instructor.",
  TERMINADO: "El tiempo de este examen ya ha terminado.",
  NO_INICIADO: "El instructor todavía no ha iniciado el examen.",
  FINALIZADO: "Este examen ya está entregado.",
  SIN_PREGUNTAS: "No hay preguntas configuradas. Avisa a tu instructor.",
  TOKEN: "No encontramos tu examen. Vuelve a entrar con el código.",
  CIUDAD: "Esa ciudad no está registrada.",
  SESION: "La sesión de examen ya no está disponible.",
  MINUTOS: "La duración no es válida.",
  NO_PERSONAL: "Tu cuenta no pertenece al personal de ESSA.",
  BLOQUEADO: "Tu examen está en pausa: pide a tu instructor que te deje continuar.",
};

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function fail(error: { message?: string } | null): never {
  const code = error?.message ?? "";
  if (MESSAGES[code]) throw new ApiError(code, MESSAGES[code]);
  if (/fetch|network|Failed/i.test(code)) throw new ApiError("RED", "Sin conexión. Comprueba tu internet e inténtalo de nuevo.");
  throw new ApiError("DESCONOCIDO", "Algo ha fallado. Inténtalo de nuevo.");
}

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) fail(error);
  return data as T;
}

// ── Alumno ───────────────────────────────────────────────────────────────
export const api = {
  publicInfo: () => rpc<PublicInfo>("public_info"),
  joinExam: (city: string, pin: string, name: string, email?: string) =>
    rpc<{ token: string; city: string }>("join_exam", { p_city: city, p_pin: pin, p_name: name, p_email: email ?? null }),
  attemptState: (token: string) => rpc<AttemptState | null>("attempt_state", { p_token: token }),
  startAttempt: (token: string) => rpc<StartedAttempt>("start_attempt", { p_token: token }),
  saveAnswer: (token: string, question: string, selected: number) =>
    rpc<void>("save_answer", { p_token: token, p_question: question, p_selected: selected }),
  reportExit: (token: string) => rpc<void>("report_exit", { p_token: token }),
  finishAttempt: (token: string, reason: "done" | "left" | "timed_out") =>
    rpc<FinishResult>("finish_attempt", { p_token: token, p_reason: reason }),
  rateAttempt: (token: string, rating: number, comment: string) =>
    rpc<void>("rate_attempt", { p_token: token, p_rating: rating, p_comment: comment }),

  // ── Personal ───────────────────────────────────────────────────────────
  openSession: (city: string) => rpc<ExamSession>("open_session", { p_city: city }),
  startSession: (id: string, minutes: number) => rpc<ExamSession>("start_session", { p_session: id, p_minutes: minutes }),
  extendSession: (id: string, minutes: number) => rpc<ExamSession>("extend_session", { p_session: id, p_minutes: minutes }),
  closeSession: (id: string) => rpc<void>("close_session", { p_session: id }),
  unlockAttempt: (id: string) => rpc<void>("unlock_attempt", { p_attempt: id }),
};

// Cuentas del personal (función del servidor con la clave privada).
export async function staffAdmin(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabase.functions.invoke("staff-admin", { body });
  if (error) {
    let message = "No se pudo completar la operación.";
    try {
      const ctx = (error as { context?: Response }).context;
      const parsed = ctx ? await ctx.json() : null;
      if (parsed?.error) message = parsed.error;
    } catch {
      /* respuesta sin cuerpo */
    }
    throw new ApiError("STAFF", message);
  }
  if (data?.error) throw new ApiError("STAFF", data.error);
}

export function errorMessage(e: unknown) {
  if (e instanceof ApiError) return e.message;
  return "Algo ha fallado. Inténtalo de nuevo.";
}

// Lanza el error de una consulta directa a tablas (panel del personal).
export function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) fail(res.error);
  return res.data as T;
}
