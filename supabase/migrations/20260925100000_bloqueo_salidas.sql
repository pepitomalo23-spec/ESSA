-- Si el alumno sale de la pantalla, su examen queda bloqueado hasta que el instructor le deje continuar.
-- El bloqueo vive en el servidor: recargar la página no lo quita.

alter table public.attempts add column locked boolean not null default false;

-- Una salida = un bloqueo. Mientras siga bloqueado, más avisos no suman (el navegador puede avisar dos veces
-- de la misma salida: pérdida de foco y página oculta).
create or replace function public.report_exit(p_token uuid) returns void
language sql security definer set search_path = public as $$
  update attempts set exits = exits + 1, locked = true
   where token = p_token and status = 'in_progress' and not locked
$$;

create or replace function public.attempt_state(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'attempt_status', a.status,
    'session_status', s.status,
    'ends_at', s.ends_at,
    'now', now(),
    'city', a.city,
    'name', a.name,
    'locked', a.locked
  )
  from attempts a join exam_sessions s on s.id = a.session_id
  where a.token = p_token
$$;

create or replace function public.start_attempt(p_token uuid) returns json
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
    'locked', a.locked,
    'answers', a.answers,
    'questions', (
      select json_agg(json_build_object('id', q.id, 'question', q.question, 'options', q.options) order by t.ord)
      from unnest(a.question_ids) with ordinality as t(qid, ord)
      join questions q on q.id = t.qid
    )
  );
end;
$$;

create or replace function public.save_answer(p_token uuid, p_question uuid, p_selected int) returns void
language plpgsql security definer set search_path = public as $$
declare
  a attempts;
  s exam_sessions;
begin
  select * into a from attempts where token = p_token for update;
  if not found then raise exception 'TOKEN'; end if;
  select * into s from exam_sessions where id = a.session_id;
  if a.status <> 'in_progress' then raise exception 'FINALIZADO'; end if;
  if a.locked then raise exception 'BLOQUEADO'; end if;
  if s.status <> 'running' or s.ends_at + interval '15 seconds' < now() then raise exception 'TERMINADO'; end if;
  if not (p_question = any (a.question_ids)) then raise exception 'PREGUNTA'; end if;
  if p_selected < 0 or p_selected > 5 then raise exception 'OPCION'; end if;
  update attempts set answers = answers || jsonb_build_object(p_question::text, p_selected) where id = a.id;
end;
$$;

-- El instructor de la sala (o un administrador) deja continuar a un alumno bloqueado.
create function public.unlock_attempt(p_attempt uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update attempts a set locked = false
    from exam_sessions s
   where a.id = p_attempt and s.id = a.session_id
     and a.status = 'in_progress' and s.status = 'running'
     and (s.instructor_id = auth.uid() or public.is_admin());
  if not found then raise exception 'SESION'; end if;
end;
$$;

revoke all on function public.unlock_attempt(uuid) from public, anon, authenticated;
grant execute on function public.unlock_attempt(uuid) to authenticated;
