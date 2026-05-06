-- ============================================================
-- VISAGISMO — Migration 0005 · Polish final
-- ============================================================
-- - clients.next_return_at + index
-- - dossiers.references ordering helper (sort_order já existe em media_assets)
-- - cleanup do enum expectativa_ia (mantém pra dados legados, mas sem efeito)
-- ============================================================

begin;

-- ---------------- clients: agendamento de retorno ----------------
alter table public.clients
  add column if not exists next_return_at timestamptz,
  add column if not exists next_return_note text;

create index if not exists clients_next_return_idx on public.clients(next_return_at)
  where next_return_at is not null;

-- ---------------- View clients_with_status: incluir next_return ----------------
drop view if exists public.clients_with_status;
create view public.clients_with_status as
select
  c.*,
  case
    when c.last_visit_at is null then 'novo'
    when now() - c.last_visit_at < interval '30 days' then 'ativo'
    when now() - c.last_visit_at < interval '60 days' then 'dormindo'
    when now() - c.last_visit_at < interval '120 days' then 'frio'
    else 'perdido'
  end as client_status,
  extract(day from now() - coalesce(c.last_visit_at, c.created_at))::int as days_since_visit,
  case
    when c.next_return_at is null then null
    else extract(day from c.next_return_at - now())::int
  end as days_to_return
from public.clients c;

commit;
