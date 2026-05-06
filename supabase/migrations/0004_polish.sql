-- ============================================================
-- VISAGISMO — Migration 0004 · Polish round
-- ============================================================
-- Adições:
--   - client_photos (galeria de fotos do cliente por ângulo)
--   - barbers.theme_preference (light|dark|auto)
--   - drawing_templates: seed de 3 templates default globais
--   - trigger: ao criar barber, marca-os como default na tabela
-- ============================================================

begin;

-- ---------------- barbers ----------------
alter table public.barbers
  add column if not exists theme_preference text not null default 'light' check (theme_preference in ('light','dark','auto'));

-- ---------------- client_photos ----------------
create table if not exists public.client_photos (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  angle         text not null check (angle in ('frontal','perfil_esquerdo','perfil_direito','tres_quartos','topo','outro')),
  storage_path  text not null,
  caption       text,
  sort_order    int default 0,
  created_at    timestamptz not null default now()
);
create index if not exists client_photos_client_idx on public.client_photos(client_id, sort_order);

alter table public.client_photos enable row level security;

drop policy if exists "barber rw fotos do seu cliente" on public.client_photos;
create policy "barber rw fotos do seu cliente"
  on public.client_photos for all
  using (exists (select 1 from public.clients c where c.id = client_id and c.barber_id = auth.uid()))
  with check (exists (select 1 from public.clients c where c.id = client_id and c.barber_id = auth.uid()));

-- ---------------- drawing_templates: seeds globais ----------------
-- vector_data usa coordenadas NORMALIZADAS (0..1) que serão escaladas
-- pelo cliente conforme tamanho da imagem.
insert into public.drawing_templates (id, barber_id, name, vector_data, is_default)
select '00000000-0000-0000-0000-000000000001'::uuid, null, 'Terços faciais',
$$
{
  "strokes": [
    {"tool":"line","color":"#535B89","size":2,"points":[{"x":0.05,"y":0.30,"p":1},{"x":0.95,"y":0.30,"p":1}]},
    {"tool":"line","color":"#535B89","size":2,"points":[{"x":0.05,"y":0.55,"p":1},{"x":0.95,"y":0.55,"p":1}]},
    {"tool":"line","color":"#535B89","size":2,"points":[{"x":0.05,"y":0.78,"p":1},{"x":0.95,"y":0.78,"p":1}]}
  ]
}
$$::jsonb, true
where not exists (select 1 from public.drawing_templates where id = '00000000-0000-0000-0000-000000000001'::uuid);

insert into public.drawing_templates (id, barber_id, name, vector_data, is_default)
select '00000000-0000-0000-0000-000000000002'::uuid, null, 'Linha da mandíbula',
$$
{
  "strokes": [
    {"tool":"pen","color":"#A03A1B","size":3,"points":[
      {"x":0.18,"y":0.55,"p":1},
      {"x":0.20,"y":0.66,"p":1},
      {"x":0.27,"y":0.78,"p":1},
      {"x":0.40,"y":0.86,"p":1},
      {"x":0.50,"y":0.88,"p":1},
      {"x":0.60,"y":0.86,"p":1},
      {"x":0.73,"y":0.78,"p":1},
      {"x":0.80,"y":0.66,"p":1},
      {"x":0.82,"y":0.55,"p":1}
    ]}
  ]
}
$$::jsonb, true
where not exists (select 1 from public.drawing_templates where id = '00000000-0000-0000-0000-000000000002'::uuid);

insert into public.drawing_templates (id, barber_id, name, vector_data, is_default)
select '00000000-0000-0000-0000-000000000003'::uuid, null, 'Conexão barba-cabelo',
$$
{
  "strokes": [
    {"tool":"line","color":"#4F8C3F","size":2,"points":[{"x":0.20,"y":0.32,"p":1},{"x":0.20,"y":0.66,"p":1}]},
    {"tool":"line","color":"#4F8C3F","size":2,"points":[{"x":0.80,"y":0.32,"p":1},{"x":0.80,"y":0.66,"p":1}]},
    {"tool":"pen","color":"#4F8C3F","size":2,"points":[
      {"x":0.20,"y":0.66,"p":1},{"x":0.30,"y":0.74,"p":1},{"x":0.40,"y":0.80,"p":1}
    ]},
    {"tool":"pen","color":"#4F8C3F","size":2,"points":[
      {"x":0.80,"y":0.66,"p":1},{"x":0.70,"y":0.74,"p":1},{"x":0.60,"y":0.80,"p":1}
    ]}
  ]
}
$$::jsonb, true
where not exists (select 1 from public.drawing_templates where id = '00000000-0000-0000-0000-000000000003'::uuid);

-- Garante leitura dos templates default por todos os barbers logados
drop policy if exists "barber rw seus templates" on public.drawing_templates;
create policy "barber rw seus templates" on public.drawing_templates
  for all
  using (barber_id = auth.uid() or barber_id is null)
  with check (barber_id = auth.uid());

-- ---------------- Storage policies (client_photos usa client-photos bucket) ----------------
-- Já temos policies em client-photos por barber_id no path. Nada novo necessário.

commit;
