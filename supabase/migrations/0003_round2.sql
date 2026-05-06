-- ============================================================
-- VISAGISMO — Migration 0003 · Rodada 2 (F8-F17)
-- ============================================================
-- Adições (não-destrutivas):
--   - barbers: logo_path, inactivity_threshold_days, whatsapp_template, tour_completed_at
--   - clients: last_visit_at (calculado por trigger ao finalizar dossiê)
--   - dossiers: mode, summary_done
--   - audio_recordings: media_kind, processing_progress, processing_stage
--   - media_assets: kinds 'expectativa_ia', 'template_desenho'
--   - barber_products: catálogo
--   - products: + product_id, purchased (campos legacy ficam — drop em outra migration)
--   - drawing_templates: templates de desenho do barbeiro
--   - bucket: barber-assets (logos + fotos de produto)
-- ============================================================

begin;

-- ---------------- barbers ----------------
alter table public.barbers
  add column if not exists logo_path text,
  add column if not exists inactivity_threshold_days int default 45,
  add column if not exists whatsapp_template text,
  add column if not exists tour_completed_at timestamptz;

-- ---------------- clients ----------------
alter table public.clients
  add column if not exists last_visit_at timestamptz;

-- ---------------- dossiers ----------------
alter table public.dossiers
  add column if not exists mode text not null default 'entrevista' check (mode in ('entrevista','acompanhamento','antes_depois')),
  add column if not exists summary_done text;

-- ---------------- audio_recordings ----------------
alter table public.audio_recordings
  add column if not exists media_kind text not null default 'audio' check (media_kind in ('audio','video')),
  add column if not exists processing_progress int not null default 0 check (processing_progress between 0 and 100),
  add column if not exists processing_stage text;

-- ---------------- media_assets enum (recreate constraint) ----------------
alter table public.media_assets drop constraint if exists media_assets_kind_check;
alter table public.media_assets add constraint media_assets_kind_check check (
  kind in (
    'foto_cliente',
    'referencia_corte',
    'referencia_barba',
    'produto',
    'marcacao_ipad',
    'expectativa_ia',
    'template_desenho'
  )
);

-- ---------------- barber_products (catálogo) ----------------
create table if not exists public.barber_products (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid not null references public.barbers(id) on delete cascade,
  name        text not null,
  photo_path  text,
  description text,
  how_to_use  text,
  why_use     text,
  price_brl   numeric(10,2),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists barber_products_barber_idx on public.barber_products(barber_id);

drop trigger if exists set_barber_products_updated_at on public.barber_products;
create trigger set_barber_products_updated_at
before update on public.barber_products
for each row execute function public.set_updated_at();

-- ---------------- products: adicionar FK + purchased ----------------
alter table public.products
  add column if not exists product_id uuid references public.barber_products(id) on delete set null,
  add column if not exists purchased  boolean not null default false;

-- ---------------- drawing_templates ----------------
create table if not exists public.drawing_templates (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid references public.barbers(id) on delete cascade,
  name        text not null,
  vector_data jsonb not null default '{}'::jsonb,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists drawing_templates_barber_idx on public.drawing_templates(barber_id);

-- ---------------- RLS ----------------
alter table public.barber_products    enable row level security;
alter table public.drawing_templates  enable row level security;

drop policy if exists "barber rw seus produtos" on public.barber_products;
create policy "barber rw seus produtos" on public.barber_products
  for all using (barber_id = auth.uid()) with check (barber_id = auth.uid());

drop policy if exists "barber rw seus templates" on public.drawing_templates;
create policy "barber rw seus templates" on public.drawing_templates
  for all
  using (barber_id = auth.uid() or barber_id is null)
  with check (barber_id = auth.uid());

-- ---------------- Trigger: atualiza last_visit_at ao finalizar ----------------
create or replace function public.update_client_last_visit()
returns trigger language plpgsql as $$
begin
  if new.status = 'finalizado' and (old.status is distinct from 'finalizado') then
    update public.clients
    set last_visit_at = greatest(coalesce(last_visit_at, '-infinity'::timestamptz), coalesce(new.finalized_at, now()))
    where id = new.client_id;
  end if;
  return new;
end $$;

drop trigger if exists on_dossier_finalized on public.dossiers;
create trigger on_dossier_finalized
after update on public.dossiers
for each row execute function public.update_client_last_visit();

-- Backfill: clientes existentes que já têm dossiê finalizado
update public.clients c
set last_visit_at = (
  select max(d.finalized_at)
  from public.dossiers d
  where d.client_id = c.id and d.status = 'finalizado'
)
where last_visit_at is null;

-- ---------------- Storage: barber-assets (logos + fotos produto) ----------------
insert into storage.buckets (id, name, public)
values ('barber-assets', 'barber-assets', false)
on conflict (id) do nothing;

drop policy if exists "barber-assets read" on storage.objects;
create policy "barber-assets read" on storage.objects for select
  using (bucket_id = 'barber-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "barber-assets write" on storage.objects;
create policy "barber-assets write" on storage.objects for insert
  with check (bucket_id = 'barber-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "barber-assets update" on storage.objects;
create policy "barber-assets update" on storage.objects for update
  using (bucket_id = 'barber-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "barber-assets delete" on storage.objects;
create policy "barber-assets delete" on storage.objects for delete
  using (bucket_id = 'barber-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------- View útil: client_status (calculado on-the-fly) ----------------
-- (não pode ser STORED generated column porque now() não é IMMUTABLE)
create or replace view public.clients_with_status as
select
  c.*,
  case
    when c.last_visit_at is null then 'novo'
    when now() - c.last_visit_at < interval '30 days' then 'ativo'
    when now() - c.last_visit_at < interval '60 days' then 'dormindo'
    when now() - c.last_visit_at < interval '120 days' then 'frio'
    else 'perdido'
  end as client_status,
  extract(day from now() - coalesce(c.last_visit_at, c.created_at))::int as days_since_visit
from public.clients c;

-- A view herda RLS da tabela clients, então cada barbeiro só vê os seus.

commit;
