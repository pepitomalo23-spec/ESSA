-- La corrección (qué respuestas eran correctas) no se enseña al entregar: la muestra el examinador cuando quiere,
-- para que nadie pase las respuestas a quien sigue examinándose. La nota y el APTO sí se ven al momento.

alter table public.exam_sessions add column answers_released boolean not null default false;

-- Resultado de un examen ya entregado. El alumno vuelve a él desde su móvil siempre que quiera.
create function public.attempt_result(p_token uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'status', a.status, 'score', a.score, 'total', a.total, 'pct', a.pct, 'pass', a.pass,
    'reviewable', cfg.show_breakdown,
    'released', s.answers_released,
    'rated', a.rating is not null,
    'breakdown', case when s.answers_released and cfg.show_breakdown then a.results end
  )
  from attempts a
  join exam_sessions s on s.id = a.session_id
  cross join settings cfg
  where a.token = p_token and cfg.id = 1 and a.status in ('done', 'left', 'timed_out')
$$;

create or replace function public.finish_attempt(p_token uuid, p_reason text) returns json
language plpgsql security definer set search_path = public as $$
declare
  a attempts;
  s exam_sessions;
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
  return public.attempt_result(p_token);
end;
$$;

-- El examinador de la sesión (o un administrador) muestra u oculta la corrección a sus alumnos, también después de cerrarla.
create function public.release_answers(p_session uuid, p_release boolean) returns exam_sessions
language plpgsql security definer set search_path = public as $$
declare s exam_sessions;
begin
  update exam_sessions set answers_released = p_release
   where id = p_session and (instructor_id = auth.uid() or public.is_admin())
  returning * into s;
  if not found then raise exception 'SESION'; end if;
  return s;
end;
$$;

revoke all on function public.attempt_result(uuid), public.release_answers(uuid, boolean) from public, anon, authenticated;
grant execute on function public.attempt_result(uuid) to anon, authenticated;
grant execute on function public.release_answers(uuid, boolean) to authenticated;
