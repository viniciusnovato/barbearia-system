-- ============================================================
-- VISAGISMO — Migration 0006 · Extras
-- ============================================================
-- Adições:
--   - barber_products: category, sort_order
--   - tags + client_tags
--   - pdf_versions (histórico)
--   - dossier_templates (salvar dossiê como modelo)
--   - notification_dismissals (mark as read em derivações)
-- ============================================================

begin;

-- ---------------- barber_products: category + sort ----------------
alter table public.barber_products
  add column if not exists category text,
  add column if not exists sort_order int not null default 0;

create index if not exists barber_products_category_idx on public.barber_products(barber_id, category);

-- ---------------- tags ----------------
create table if not exists public.tags (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid not null references public.barbers(id) on delete cascade,
  name        text not null,
  color       text not null default '#535B89',
  created_at  timestamptz not null default now(),
  unique (barber_id, name)
);

create table if not exists public.client_tags (
  client_id  uuid not null references public.clients(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, tag_id)
);
create index if not exists client_tags_tag_idx on public.client_tags(tag_id);

alter table public.tags        enable row level security;
alter table public.client_tags enable row level security;

drop policy if exists "barber rw suas tags" on public.tags;
create policy "barber rw suas tags" on public.tags
  for all using (barber_id = auth.uid()) with check (barber_id = auth.uid());

drop policy if exists "barber rw client_tags via cliente" on public.client_tags;
create policy "barber rw client_tags via cliente" on public.client_tags
  for all
  using (exists (select 1 from public.clients c where c.id = client_id and c.barber_id = auth.uid()))
  with check (exists (select 1 from public.clients c where c.id = client_id and c.barber_id = auth.uid()));

-- ---------------- pdf_versions ----------------
create table if not exists public.pdf_versions (
  id            uuid primary key default gen_random_uuid(),
  dossier_id    uuid not null references public.dossiers(id) on delete cascade,
  storage_path  text not null,
  generated_at  timestamptz not null default now(),
  generated_by  uuid references public.barbers(id)
);
create index if not exists pdf_versions_dossier_idx on public.pdf_versions(dossier_id, generated_at desc);

alter table public.pdf_versions enable row level security;

drop policy if exists "pdf_versions rw via barber" on public.pdf_versions;
create policy "pdf_versions rw via barber" on public.pdf_versions
  for all using (public.is_my_dossier(dossier_id)) with check (public.is_my_dossier(dossier_id));

-- ---------------- dossier_templates ----------------
create table if not exists public.dossier_templates (
  id          uuid primary key default gen_random_uuid(),
  barber_id   uuid not null references public.barbers(id) on delete cascade,
  name        text not null,
  description text,
  fields      jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  unique (barber_id, name)
);

alter table public.dossier_templates enable row level security;

drop policy if exists "barber rw seus templates de dossie" on public.dossier_templates;
create policy "barber rw seus templates de dossie" on public.dossier_templates
  for all using (barber_id = auth.uid()) with check (barber_id = auth.uid());

-- ---------------- notification_dismissals ----------------
-- Notificações são derivadas das tabelas existentes. Esta tabela apenas
-- marca quais o barbeiro já dispensou (pra parar de mostrar).
create table if not exists public.notification_dismissals (
  barber_id      uuid not null references public.barbers(id) on delete cascade,
  notification_key text not null, -- ex: "return:<client_id>", "inactive:<client_id>"
  dismissed_at   timestamptz not null default now(),
  primary key (barber_id, notification_key)
);

alter table public.notification_dismissals enable row level security;

drop policy if exists "barber rw seus dismissals" on public.notification_dismissals;
create policy "barber rw seus dismissals" on public.notification_dismissals
  for all using (barber_id = auth.uid()) with check (barber_id = auth.uid());

commit;
