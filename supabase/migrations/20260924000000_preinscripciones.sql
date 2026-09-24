-- Solicitudes de preinscripción enviadas desde la web pública.
-- Los visitantes (rol anon) solo pueden INSERTAR; nadie puede leerlas con la clave pública.
-- Consúltalas desde el panel de Supabase (Table Editor) o con la service role key.

create table if not exists public.preinscripciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null check (char_length(nombre) between 3 and 120),
  email text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  telefono text check (telefono is null or char_length(telefono) <= 20),
  curso text not null check (char_length(curso) <= 120),
  sede text not null check (char_length(sede) <= 80),
  mensaje text check (mensaje is null or char_length(mensaje) <= 1500),
  acepta_privacidad boolean not null check (acepta_privacidad),
  estado text not null default 'nueva' check (estado in ('nueva', 'contactada', 'matriculada', 'descartada'))
);

create index if not exists preinscripciones_created_at_idx on public.preinscripciones (created_at desc);

alter table public.preinscripciones enable row level security;

-- Solo inserción desde la web; el estado lo gestiona la escuela, no el visitante.
drop policy if exists "web puede insertar preinscripciones" on public.preinscripciones;
create policy "web puede insertar preinscripciones"
  on public.preinscripciones
  for insert
  to anon, authenticated
  with check (estado = 'nueva');

revoke all on public.preinscripciones from anon, authenticated;
grant insert (nombre, email, telefono, curso, sede, mensaje, acepta_privacidad)
  on public.preinscripciones to anon, authenticated;
