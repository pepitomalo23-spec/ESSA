-- App de evaluación ESSA: personal, ciudades, preguntas, ajustes, sesiones de examen e intentos.
-- Los alumnos no tienen cuenta: solo usan las funciones RPC públicas con el token de su intento.
-- Las respuestas correctas nunca salen del servidor hasta que el alumno termina.

drop table if exists public.preinscripciones;

-- ── Tablas ────────────────────────────────────────────────────────────────
create table public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null check (char_length(name) between 2 and 120),
  role text not null check (role in ('admin', 'instructor')),
  created_at timestamptz not null default now()
);

create table public.cities (
  name text primary key check (char_length(name) between 2 and 80),
  created_at timestamptz not null default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  question text not null check (char_length(question) between 3 and 1000),
  options text[] not null check (array_length(options, 1) between 2 and 6),
  correct int not null,
  explanation text check (explanation is null or char_length(explanation) <= 1000),
  created_at timestamptz not null default now(),
  check (correct >= 0 and correct < array_length(options, 1))
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  exam_title text not null default 'Primeros Auxilios' check (char_length(exam_title) between 2 and 80),
  questions_per_attempt int check (questions_per_attempt is null or questions_per_attempt > 0),
  pass_threshold int not null default 60 check (pass_threshold between 1 and 100),
  random_order boolean not null default true,
  show_breakdown boolean not null default true,
  review_threshold int not null default 4 check (review_threshold between 1 and 5),
  exam_minutes int not null default 10 check (exam_minutes between 1 and 180),
  google_review_url text
);

-- Lista blanca de alumnos: si tiene alguna fila, el alumno debe identificarse con un email de la lista.
create table public.allowed_students (
  email text primary key check (email = lower(email) and email like '%_@_%.__%'),
  name text,
  created_at timestamptz not null default now()
);

create table public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.staff(user_id) on delete set null,
  instructor_name text not null,
  city text not null,
  pin text not null check (pin ~ '^[0-9]{6}$'),
  status text not null default 'waiting' check (status in ('waiting', 'running', 'closed')),
  duration_minutes int,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index exam_sessions_one_open_per_instructor on public.exam_sessions (instructor_id) where status <> 'closed';
create unique index exam_sessions_open_pin on public.exam_sessions (pin) where status <> 'closed';
create index exam_sessions_created_at on public.exam_sessions (created_at desc);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid() unique,
  session_id uuid not null references public.exam_sessions(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  email text,
  city text not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'done', 'left', 'timed_out')),
  question_ids uuid[],
  answers jsonb not null default '{}'::jsonb,
  results jsonb,
  score int,
  total int,
  pct int,
  pass boolean,
  exits int not null default 0,
  rating int check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index attempts_session on public.attempts (session_id);
create index attempts_created_at on public.attempts (created_at desc);

-- ── Roles ─────────────────────────────────────────────────────────────────
create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid())
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from staff where user_id = auth.uid() and role = 'admin')
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.staff enable row level security;
alter table public.cities enable row level security;
alter table public.questions enable row level security;
alter table public.settings enable row level security;
alter table public.allowed_students enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.attempts enable row level security;

revoke all on public.staff, public.cities, public.questions, public.settings,
  public.allowed_students, public.exam_sessions, public.attempts from anon, authenticated;

grant select on public.staff, public.cities, public.questions, public.settings,
  public.allowed_students, public.exam_sessions, public.attempts to authenticated;
grant insert, update, delete on public.cities, public.questions, public.allowed_students to authenticated;
grant update on public.settings to authenticated;
grant delete on public.attempts to authenticated;

create policy staff_read on public.staff for select to authenticated using (public.is_staff());

create policy cities_read on public.cities for select to authenticated using (public.is_staff());
create policy cities_admin_ins on public.cities for insert to authenticated with check (public.is_admin());
create policy cities_admin_upd on public.cities for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy cities_admin_del on public.cities for delete to authenticated using (public.is_admin());

create policy questions_read on public.questions for select to authenticated using (public.is_staff());
create policy questions_admin_ins on public.questions for insert to authenticated with check (public.is_admin());
create policy questions_admin_upd on public.questions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy questions_admin_del on public.questions for delete to authenticated using (public.is_admin());

create policy settings_read on public.settings for select to authenticated using (public.is_staff());
create policy settings_admin_upd on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy allowed_admin_read on public.allowed_students for select to authenticated using (public.is_admin());
create policy allowed_admin_ins on public.allowed_students for insert to authenticated with check (public.is_admin());
create policy allowed_admin_upd on public.allowed_students for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy allowed_admin_del on public.allowed_students for delete to authenticated using (public.is_admin());

create policy sessions_read on public.exam_sessions for select to authenticated using (public.is_staff());
create policy attempts_read on public.attempts for select to authenticated using (public.is_staff());
create policy attempts_admin_del on public.attempts for delete to authenticated using (public.is_admin());

-- ── Corrección (interna) ──────────────────────────────────────────────────
create function public.grade_attempt(p_attempt uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare
  a attempts;
  v_results jsonb;
  v_score int;
  v_total int;
  v_pct int;
  v_threshold int;
begin
  select * into a from attempts where id = p_attempt for update;
  if not found or a.status in ('done', 'left', 'timed_out') then return; end if;

  select pass_threshold into v_threshold from settings where id = 1;
  v_total := coalesce(array_length(a.question_ids, 1), 0);

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', q.id, 'question', q.question, 'options', to_jsonb(q.options),
           'correct', q.correct, 'explanation', q.explanation,
           'selected', (a.answers ->> q.id::text)::int,
           'ok', (a.answers ->> q.id::text)::int = q.correct
         ) order by t.ord), '[]'::jsonb),
         count(*) filter (where (a.answers ->> q.id::text)::int = q.correct)
    into v_results, v_score
    from unnest(coalesce(a.question_ids, '{}'::uuid[])) with ordinality as t(qid, ord)
    join questions q on q.id = t.qid
   where a.answers ? q.id::text;

  v_pct := case when v_total > 0 then round(v_score * 100.0 / v_total) else 0 end;

  update attempts set
    status = p_status,
    results = v_results,
    score = v_score,
    total = v_total,
    pct = v_pct,
    pass = p_status <> 'left' and v_total > 0 and v_pct >= coalesce(v_threshold, 60),
    finished_at = now()
  where id = p_attempt;
end;
$$;

-- ── Funciones públicas (alumnos) ──────────────────────────────────────────
create function public.public_info() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'cities', coalesce((select json_agg(name order by name) from cities), '[]'::json),
    'open', coalesce((select json_agg(json_build_object('city', city, 'status', status))
                        from exam_sessions where status <> 'closed'
                         and (status = 'waiting' or ends_at > now())), '[]'::json),
    'require_email', exists (select 1 from allowed_students),
    'setup_needed', not exists (select 1 from staff where role = 'admin'),
    'exam_title', (select exam_title from settings where id = 1),
    'review_threshold', (select review_threshold from settings where id = 1),
    'google_review_url', (select google_review_url from settings where id = 1),
    'now', now()
  )
$$;

create function public.join_exam(p_city text, p_pin text, p_name text, p_email text default null) returns json
language plpgsql security definer set search_path = public as $$
declare
  s exam_sessions;
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_token uuid;
begin
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'NOMBRE'; end if;
  select * into s from exam_sessions where pin = trim(p_pin) and status <> 'closed';
  if not found then
    perform pg_sleep(0.4); -- frena la prueba de PIN a ciegas
    raise exception 'PIN';
  end if;
  if exists (select 1 from allowed_students)
     and (v_email is null or not exists (select 1 from allowed_students where email = v_email)) then
    raise exception 'NO_AUTORIZADO';
  end if;
  if s.status = 'running' and s.ends_at <= now() then raise exception 'TERMINADO'; end if;

  insert into attempts (session_id, name, email, city)
  values (s.id, trim(p_name), v_email, s.city)
  returning token into v_token;
  return json_build_object('token', v_token, 'city', s.city);
end;
$$;

create function public.attempt_state(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'attempt_status', a.status,
    'session_status', s.status,
    'ends_at', s.ends_at,
    'now', now(),
    'city', a.city,
    'name', a.name
  )
  from attempts a join exam_sessions s on s.id = a.session_id
  where a.token = p_token
$$;

create function public.start_attempt(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  a attempts;
  s exam_sessions;
  cfg settings;
  v_ids uuid[];
begin
  select * into a from attempts where token = p_token for update;
  if not found then raise exception 'TOKEN'; end if;
  select * into s from exam_sessions where id = a.session_id;
  if a.status not in ('waiting', 'in_progress') then raise exception 'FINALIZADO'; end if;
  if s.status <> 'running' then raise exception 'NO_INICIADO'; end if;
  if s.ends_at <= now() then raise exception 'TERMINADO'; end if;

  if a.question_ids is null then
    select * into cfg from settings where id = 1;
    select array_agg(id) into v_ids from (
      select id from questions
      order by case when cfg.random_order then random() end, position, created_at
      limit cfg.questions_per_attempt
    ) x;
    if v_ids is null then raise exception 'SIN_PREGUNTAS'; end if;
    update attempts set question_ids = v_ids, status = 'in_progress', started_at = now()
     where id = a.id returning * into a;
  end if;

  return json_build_object(
    'ends_at', s.ends_at,
    'now', now(),
    'answers', a.answers,
    'questions', (
      select json_agg(json_build_object('id', q.id, 'question', q.question, 'options', q.options) order by t.ord)
      from unnest(a.question_ids) with ordinality as t(qid, ord)
      join questions q on q.id = t.qid
    )
  );
end;
$$;

create function public.save_answer(p_token uuid, p_question uuid, p_selected int) returns void
language plpgsql security definer set search_path = public as $$
declare
  a attempts;
  s exam_sessions;
begin
  select * into a from attempts where token = p_token for update;
  if not found then raise exception 'TOKEN'; end if;
  select * into s from exam_sessions where id = a.session_id;
  if a.status <> 'in_progress' then raise exception 'FINALIZADO'; end if;
  if s.status <> 'running' or s.ends_at + interval '15 seconds' < now() then raise exception 'TERMINADO'; end if;
  if not (p_question = any (a.question_ids)) then raise exception 'PREGUNTA'; end if;
  if p_selected < 0 or p_selected > 5 then raise exception 'OPCION'; end if;
  update attempts set answers = answers || jsonb_build_object(p_question::text, p_selected) where id = a.id;
end;
$$;

create function public.report_exit(p_token uuid) returns void
language sql security definer set search_path = public as $$
  update attempts set exits = exits + 1 where token = p_token and status = 'in_progress'
$$;

create function public.finish_attempt(p_token uuid, p_reason text) returns json
language plpgsql security definer set search_path = public as $$
declare
  a attempts;
  s exam_sessions;
  cfg settings;
  v_status text;
begin
  if p_reason not in ('done', 'left', 'timed_out') then raise exception 'MOTIVO'; end if;
  select * into a from attempts where token = p_token;
  if not found then raise exception 'TOKEN'; end if;
  select * into s from exam_sessions where id = a.session_id;

  if a.status = 'waiting' then
    delete from attempts where id = a.id;
    return json_build_object('status', 'cancelled');
  end if;

  v_status := p_reason;
  if p_reason = 'done' and (s.status = 'closed' or s.ends_at + interval '15 seconds' < now()) then
    v_status := 'timed_out';
  end if;
  perform grade_attempt(a.id, v_status);

  select * into a from attempts where id = a.id;
  select * into cfg from settings where id = 1;
  return json_build_object(
    'status', a.status, 'score', a.score, 'total', a.total, 'pct', a.pct, 'pass', a.pass,
    'breakdown', case when cfg.show_breakdown then a.results end
  );
end;
$$;

create function public.rate_attempt(p_token uuid, p_rating int, p_comment text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_rating not between 1 and 5 then raise exception 'VALORACION'; end if;
  update attempts set rating = p_rating, comment = nullif(left(trim(coalesce(p_comment, '')), 1000), '')
   where token = p_token and status in ('done', 'timed_out', 'left');
end;
$$;

-- ── Funciones del personal ────────────────────────────────────────────────
create function public.open_session(p_city text) returns exam_sessions
language plpgsql security definer set search_path = public as $$
declare
  me staff;
  s exam_sessions;
  v_pin text;
begin
  select * into me from staff where user_id = auth.uid();
  if not found then raise exception 'NO_PERSONAL'; end if;
  select * into s from exam_sessions where instructor_id = me.user_id and status <> 'closed';
  if found then return s; end if;
  if not exists (select 1 from cities where name = p_city) then raise exception 'CIUDAD'; end if;
  loop
    v_pin := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from exam_sessions where pin = v_pin and status <> 'closed');
  end loop;
  insert into exam_sessions (instructor_id, instructor_name, city, pin)
  values (me.user_id, me.name, p_city, v_pin) returning * into s;
  return s;
end;
$$;

create function public.start_session(p_session uuid, p_minutes int) returns exam_sessions
language plpgsql security definer set search_path = public as $$
declare s exam_sessions;
begin
  if p_minutes not between 1 and 180 then raise exception 'MINUTOS'; end if;
  update exam_sessions set status = 'running', duration_minutes = p_minutes,
         starts_at = now(), ends_at = now() + make_interval(mins => p_minutes)
   where id = p_session and status = 'waiting'
     and (instructor_id = auth.uid() or public.is_admin())
  returning * into s;
  if not found then raise exception 'SESION'; end if;
  return s;
end;
$$;

create function public.extend_session(p_session uuid, p_minutes int) returns exam_sessions
language plpgsql security definer set search_path = public as $$
declare s exam_sessions;
begin
  if p_minutes not between 1 and 60 then raise exception 'MINUTOS'; end if;
  update exam_sessions set ends_at = greatest(ends_at, now()) + make_interval(mins => p_minutes),
         duration_minutes = duration_minutes + p_minutes
   where id = p_session and status = 'running'
     and (instructor_id = auth.uid() or public.is_admin())
  returning * into s;
  if not found then raise exception 'SESION'; end if;
  return s;
end;
$$;

create function public.close_session(p_session uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  s exam_sessions;
  r record;
begin
  select * into s from exam_sessions where id = p_session and status <> 'closed'
     and (instructor_id = auth.uid() or public.is_admin());
  if not found then raise exception 'SESION'; end if;
  for r in select id from attempts where session_id = s.id and status = 'in_progress' loop
    perform grade_attempt(r.id, 'timed_out');
  end loop;
  delete from attempts where session_id = s.id and status = 'waiting';
  update exam_sessions set status = 'closed', closed_at = now() where id = s.id;
end;
$$;

-- Supabase concede EXECUTE a anon/authenticated por defecto: se retira y se da solo lo necesario.
revoke all on function public.is_staff(), public.is_admin(), public.grade_attempt(uuid, text),
  public.public_info(), public.join_exam(text, text, text, text),
  public.attempt_state(uuid), public.start_attempt(uuid), public.save_answer(uuid, uuid, int),
  public.report_exit(uuid), public.finish_attempt(uuid, text), public.rate_attempt(uuid, int, text),
  public.open_session(text), public.start_session(uuid, int), public.extend_session(uuid, int),
  public.close_session(uuid) from public, anon, authenticated;
grant execute on function public.public_info(), public.join_exam(text, text, text, text),
  public.attempt_state(uuid), public.start_attempt(uuid), public.save_answer(uuid, uuid, int),
  public.report_exit(uuid), public.finish_attempt(uuid, text), public.rate_attempt(uuid, int, text)
  to anon, authenticated;
grant execute on function public.is_staff(), public.is_admin(), public.open_session(text),
  public.start_session(uuid, int), public.extend_session(uuid, int), public.close_session(uuid)
  to authenticated;

-- ── Tiempo real para el panel del instructor ─────────────────────────────
alter publication supabase_realtime add table public.attempts, public.exam_sessions;

-- ── Datos iniciales (los de la app original) ─────────────────────────────
insert into public.settings (id, google_review_url) values (1, 'https://g.page/r/CUIh39kNAh_XEBM/review');

insert into public.cities (name) values
  ('Almería'), ('Cádiz'), ('Córdoba'), ('Granada'), ('Huelva'), ('Jaén'), ('Málaga'), ('Sevilla');

insert into public.questions (position, question, options, correct, explanation) values
  (1, '¿Cuál es el primer paso ante una persona inconsciente que no respira?',
   array['Empezar la RCP inmediatamente', 'Comprobar que la zona es segura y avisar al 112', 'Darle agua', 'Esperar a que despierte'],
   1, 'El protocolo PAS indica: Proteger, Avisar y Socorrer.'),
  (2, '¿Qué número de emergencias se usa en España?', array['091', '112', '061', '080'],
   1, 'El 112 es el número único de emergencias en toda la UE.'),
  (3, 'Ante una quemadura leve, ¿qué se debe hacer primero?',
   array['Aplicar hielo directamente', 'Enfriar con agua fresca corriente varios minutos', 'Reventar las ampollas', 'Aplicar pasta de dientes'],
   1, 'El agua fresca reduce el daño térmico sin lesionar más la piel.'),
  (4, 'Si alguien se atraganta y no puede hablar ni toser, ¿qué se recomienda?',
   array['Darle agua', 'Maniobra de Heimlich', 'Inclinar la cabeza hacia atrás', 'Esperar'],
   1, 'La maniobra de Heimlich ayuda a expulsar el objeto que obstruye la vía aérea.'),
  (5, '¿Cómo se coloca a una persona inconsciente que respira?',
   array['Boca arriba', 'Sentada', 'Posición lateral de seguridad', 'Boca abajo'],
   2, 'Mantiene la vía aérea despejada y evita atragantamientos.'),
  (6, 'Ante una hemorragia externa importante, ¿cuál es la acción prioritaria?',
   array['Aplicar un torniquete siempre', 'Hacer presión directa sobre la herida', 'Lavar con alcohol', 'Mover a la persona'],
   1, 'La presión directa controla la mayoría de hemorragias.'),
  (7, '¿Qué significan las siglas PAS?',
   array['Proteger, Avisar, Socorrer', 'Parar, Actuar, Salvar', 'Primero Ayuda Siempre', 'Prevención, Acción, Seguridad'],
   0, 'PAS es el orden recomendado de actuación ante cualquier emergencia.');
