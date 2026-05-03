-- ============================================================
-- VISAGISMO — Migration 0001 · Setup inicial
-- ============================================================
-- Aplica:
--   1. Tabela `barbers` (perfil do profissional, 1:1 com auth.users)
--   2. Tabela `clients` (clientes do barbeiro)
--   3. Trigger auto-cria barber quando usuário se cadastra
--   4. Backfill do usuário-exemplo já existente
--   5. RLS habilitado + policies por barber_id = auth.uid()
--   6. Bucket de Storage `client-photos` (privado)
--   7. Triggers de updated_at
-- ============================================================

begin;

-- ---------------- Extensions ----------------
create extension if not exists pg_trgm;

-- ---------------- Helpers ----------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------- barbers ----------------
create table if not exists public.barbers (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  instagram   text,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists set_barbers_updated_at on public.barbers;
create trigger set_barbers_updated_at
before update on public.barbers
for each row execute function public.set_updated_at();

-- Auto-cria registro em `barbers` quando um auth.user é criado
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.barbers (id, full_name, instagram)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'instagram'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill: usuário-exemplo já existe (criado via seed antes da migration)
insert into public.barbers (id, full_name, instagram)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'instagram'
from auth.users u
on conflict (id) do nothing;

-- ---------------- clients ----------------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid not null references public.barbers(id) on delete cascade,
  full_name   text not null,
  phone       text,
  instagram   text,
  photo_url   text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists clients_barber_idx on public.clients(barber_id);
create index if not exists clients_name_trgm_idx on public.clients using gin (full_name gin_trgm_ops);

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

-- ---------------- RLS ----------------
alter table public.barbers enable row level security;
alter table public.clients enable row level security;

-- barbers: cada um lê e edita apenas seu próprio registro
drop policy if exists "barber lê o próprio perfil" on public.barbers;
create policy "barber lê o próprio perfil"
  on public.barbers for select
  using (auth.uid() = id);

drop policy if exists "barber edita o próprio perfil" on public.barbers;
create policy "barber edita o próprio perfil"
  on public.barbers for update
  using (auth.uid() = id);

-- clients: barbeiro tem acesso total aos próprios clientes
drop policy if exists "barber lê seus clientes" on public.clients;
create policy "barber lê seus clientes"
  on public.clients for select
  using (barber_id = auth.uid());

drop policy if exists "barber cria clientes" on public.clients;
create policy "barber cria clientes"
  on public.clients for insert
  with check (barber_id = auth.uid());

drop policy if exists "barber atualiza seus clientes" on public.clients;
create policy "barber atualiza seus clientes"
  on public.clients for update
  using (barber_id = auth.uid())
  with check (barber_id = auth.uid());

drop policy if exists "barber deleta seus clientes" on public.clients;
create policy "barber deleta seus clientes"
  on public.clients for delete
  using (barber_id = auth.uid());

-- ---------------- Storage ----------------
-- Bucket para fotos de clientes (privado; acesso via signed URLs)
insert into storage.buckets (id, name, public)
values ('client-photos', 'client-photos', false)
on conflict (id) do nothing;

-- Política: barbeiro só lê/escreve fotos dentro do prefixo do seu próprio id
-- Convenção de path: client-photos/<barber_id>/<client_id>/<filename>
drop policy if exists "barber lê suas fotos de cliente" on storage.objects;
create policy "barber lê suas fotos de cliente"
  on storage.objects for select
  using (
    bucket_id = 'client-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "barber sobe suas fotos de cliente" on storage.objects;
create policy "barber sobe suas fotos de cliente"
  on storage.objects for insert
  with check (
    bucket_id = 'client-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "barber atualiza suas fotos de cliente" on storage.objects;
create policy "barber atualiza suas fotos de cliente"
  on storage.objects for update
  using (
    bucket_id = 'client-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "barber deleta suas fotos de cliente" on storage.objects;
create policy "barber deleta suas fotos de cliente"
  on storage.objects for delete
  using (
    bucket_id = 'client-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;

-- ---------------- Sanity check ----------------
-- Após rodar, este select deve retornar 1 linha (Dr. Leonardo Saraiva):
-- select id, full_name, instagram from public.barbers;
