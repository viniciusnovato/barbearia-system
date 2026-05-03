-- ============================================================
-- VISAGISMO — Migration 0002 · Dossiê completo
-- ============================================================
-- Tabelas: dossiers, audio_recordings, transcript_blocks,
--          dossier_fields, media_assets, ipad_annotations, products
-- Buckets: audio, references, annotations, pdfs
-- RLS por barber via cadeia dossier → client → barber
-- ============================================================

begin;

-- ---------------- dossiers ----------------
create table if not exists public.dossiers (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  title           text not null,
  scheduled_date  date not null default current_date,
  status          text not null default 'rascunho' check (status in ('rascunho', 'em_revisao', 'finalizado')),
  pdf_url         text,
  finalized_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists dossiers_client_idx on public.dossiers(client_id, scheduled_date desc);

drop trigger if exists set_dossiers_updated_at on public.dossiers;
create trigger set_dossiers_updated_at
before update on public.dossiers
for each row execute function public.set_updated_at();

-- ---------------- audio_recordings ----------------
create table if not exists public.audio_recordings (
  id               uuid primary key default gen_random_uuid(),
  dossier_id       uuid not null references public.dossiers(id) on delete cascade,
  source           text not null check (source in ('live', 'upload')),
  storage_path     text not null,
  mime_type        text,
  duration_seconds numeric,
  transcript_full  text,
  processed_at     timestamptz,
  error            text,
  created_at       timestamptz not null default now()
);
create index if not exists audio_dossier_idx on public.audio_recordings(dossier_id);

-- ---------------- transcript_blocks ----------------
create table if not exists public.transcript_blocks (
  id                uuid primary key default gen_random_uuid(),
  audio_id          uuid not null references public.audio_recordings(id) on delete cascade,
  dossier_id        uuid not null references public.dossiers(id) on delete cascade,
  ord               integer not null,
  speaker           text not null check (speaker in ('barbeiro', 'cliente', 'indef')),
  text              text not null,
  start_seconds     numeric,
  end_seconds       numeric,
  intent            text,
  target_field_key  text,
  is_noise          boolean default false,
  created_at        timestamptz not null default now()
);
create index if not exists blocks_audio_idx on public.transcript_blocks(audio_id, ord);
create index if not exists blocks_dossier_idx on public.transcript_blocks(dossier_id);
create index if not exists blocks_target_idx on public.transcript_blocks(dossier_id, target_field_key);

-- ---------------- dossier_fields ----------------
create table if not exists public.dossier_fields (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers(id) on delete cascade,
  section           text not null,
  field_key         text not null,
  value             text,
  status            text not null default 'vazio' check (status in ('vazio', 'sugerido', 'editado', 'aprovado', 'conflito')),
  source_block_ids  uuid[] default '{}',
  updated_at        timestamptz not null default now(),
  unique (dossier_id, field_key)
);
create index if not exists fields_dossier_idx on public.dossier_fields(dossier_id, section);

drop trigger if exists set_fields_updated_at on public.dossier_fields;
create trigger set_fields_updated_at
before update on public.dossier_fields
for each row execute function public.set_updated_at();

-- ---------------- media_assets ----------------
create table if not exists public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  dossier_id        uuid not null references public.dossiers(id) on delete cascade,
  kind              text not null check (kind in ('foto_cliente', 'referencia_corte', 'referencia_barba', 'produto', 'marcacao_ipad')),
  storage_path      text not null,
  bucket            text not null,
  caption           text,
  sort_order        integer default 0,
  included_in_pdf   boolean default true,
  parent_asset_id   uuid references public.media_assets(id) on delete cascade,
  created_at        timestamptz not null default now()
);
create index if not exists media_dossier_idx on public.media_assets(dossier_id, kind);

-- ---------------- ipad_annotations ----------------
create table if not exists public.ipad_annotations (
  id            uuid primary key default gen_random_uuid(),
  asset_id      uuid not null references public.media_assets(id) on delete cascade,
  version_name  text not null,
  vector_data   jsonb,
  preview_path  text,
  created_at    timestamptz not null default now()
);
create index if not exists ann_asset_idx on public.ipad_annotations(asset_id);

-- ---------------- products ----------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  dossier_id   uuid not null references public.dossiers(id) on delete cascade,
  name         text not null,
  description  text,
  photo_path   text,
  sort_order   integer default 0,
  created_at   timestamptz not null default now()
);
create index if not exists products_dossier_idx on public.products(dossier_id);

-- ---------------- Helper: is_my_dossier (criado APÓS as tabelas) ----------------
create or replace function public.is_my_dossier(p_dossier_id uuid)
returns boolean language plpgsql security definer set search_path = public stable as $$
begin
  return exists (
    select 1
    from public.dossiers d
    join public.clients c on c.id = d.client_id
    where d.id = p_dossier_id and c.barber_id = auth.uid()
  );
end $$;

-- ---------------- RLS ----------------
alter table public.dossiers          enable row level security;
alter table public.audio_recordings  enable row level security;
alter table public.transcript_blocks enable row level security;
alter table public.dossier_fields    enable row level security;
alter table public.media_assets      enable row level security;
alter table public.ipad_annotations  enable row level security;
alter table public.products          enable row level security;

-- dossiers: vincula via client.barber_id
do $$
declare t text; act text;
begin
  for t in select unnest(array['dossiers','audio_recordings','transcript_blocks','dossier_fields','media_assets','products']) loop
    execute format('drop policy if exists "%s rw via barber" on public.%I', t, t);
  end loop;
end $$;

create policy "dossiers rw via barber" on public.dossiers
  for all
  using (exists (select 1 from public.clients c where c.id = client_id and c.barber_id = auth.uid()))
  with check (exists (select 1 from public.clients c where c.id = client_id and c.barber_id = auth.uid()));

create policy "audio_recordings rw via barber" on public.audio_recordings
  for all using (public.is_my_dossier(dossier_id)) with check (public.is_my_dossier(dossier_id));

create policy "transcript_blocks rw via barber" on public.transcript_blocks
  for all using (public.is_my_dossier(dossier_id)) with check (public.is_my_dossier(dossier_id));

create policy "dossier_fields rw via barber" on public.dossier_fields
  for all using (public.is_my_dossier(dossier_id)) with check (public.is_my_dossier(dossier_id));

create policy "media_assets rw via barber" on public.media_assets
  for all using (public.is_my_dossier(dossier_id)) with check (public.is_my_dossier(dossier_id));

create policy "products rw via barber" on public.products
  for all using (public.is_my_dossier(dossier_id)) with check (public.is_my_dossier(dossier_id));

drop policy if exists "ipad_annotations rw via barber" on public.ipad_annotations;
create policy "ipad_annotations rw via barber" on public.ipad_annotations
  for all
  using (exists (select 1 from public.media_assets m where m.id = asset_id and public.is_my_dossier(m.dossier_id)))
  with check (exists (select 1 from public.media_assets m where m.id = asset_id and public.is_my_dossier(m.dossier_id)));

-- ---------------- Buckets de Storage ----------------
insert into storage.buckets (id, name, public)
values
  ('audio',       'audio',       false),
  ('references',  'references',  false),
  ('annotations', 'annotations', false),
  ('pdfs',        'pdfs',        false)
on conflict (id) do nothing;

-- Policies dos buckets: barbeiro só acessa pasta com seu auth.uid()
do $$
declare b text;
begin
  for b in select unnest(array['audio','references','annotations','pdfs']) loop
    execute format('drop policy if exists "%s read" on storage.objects', b);
    execute format('drop policy if exists "%s write" on storage.objects', b);
    execute format('drop policy if exists "%s update" on storage.objects', b);
    execute format('drop policy if exists "%s delete" on storage.objects', b);
  end loop;
end $$;

create policy "audio read"   on storage.objects for select using (bucket_id = 'audio'       and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio write"  on storage.objects for insert with check (bucket_id = 'audio'       and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio update" on storage.objects for update using (bucket_id = 'audio'       and (storage.foldername(name))[1] = auth.uid()::text);
create policy "audio delete" on storage.objects for delete using (bucket_id = 'audio'       and (storage.foldername(name))[1] = auth.uid()::text);

create policy "references read"   on storage.objects for select using (bucket_id = 'references'  and (storage.foldername(name))[1] = auth.uid()::text);
create policy "references write"  on storage.objects for insert with check (bucket_id = 'references'  and (storage.foldername(name))[1] = auth.uid()::text);
create policy "references update" on storage.objects for update using (bucket_id = 'references'  and (storage.foldername(name))[1] = auth.uid()::text);
create policy "references delete" on storage.objects for delete using (bucket_id = 'references'  and (storage.foldername(name))[1] = auth.uid()::text);

create policy "annotations read"   on storage.objects for select using (bucket_id = 'annotations' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "annotations write"  on storage.objects for insert with check (bucket_id = 'annotations' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "annotations update" on storage.objects for update using (bucket_id = 'annotations' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "annotations delete" on storage.objects for delete using (bucket_id = 'annotations' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "pdfs read"   on storage.objects for select using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs write"  on storage.objects for insert with check (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs update" on storage.objects for update using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pdfs delete" on storage.objects for delete using (bucket_id = 'pdfs' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
