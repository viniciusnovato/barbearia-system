import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { FadeIn } from "@/app/(app)/_components/FadeIn";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ q?: string; filter?: string }>;
}

const FILTER_LABELS: Record<string, string> = {
  todos: "Todos",
  novo: "Novos",
  ativo: "Ativos",
  dormindo: "Dormindo",
  frio: "Frios",
  perdido: "Perdidos",
};

export default async function ClientsPage({ searchParams }: PageProps) {
  const { q = "", filter = "todos" } = await searchParams;
  const supabase = await createServerSupabase();

  let query = supabase
    .from("clients_with_status")
    .select("id, full_name, phone, instagram, photo_url, last_visit_at, days_since_visit, client_status, created_at")
    .order("last_visit_at", { ascending: false, nullsFirst: false });

  if (filter !== "todos" && filter in FILTER_LABELS) {
    query = query.eq("client_status", filter);
  }
  if (q.trim().length > 0) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,instagram.ilike.%${q}%`);
  }

  const { data: clients } = await query;

  // Conta dossiês por cliente
  const ids = (clients ?? []).map((c) => c.id);
  const { data: dossierRows } = ids.length
    ? await supabase.from("dossiers").select("client_id").in("client_id", ids)
    : { data: [] as { client_id: string }[] };
  const dossierCount = new Map<string, number>();
  (dossierRows ?? []).forEach((d) => {
    dossierCount.set(d.client_id, (dossierCount.get(d.client_id) ?? 0) + 1);
  });

  // Último produto comprado por cliente
  const { data: lastProducts } = ids.length
    ? await supabase
        .from("products")
        .select("dossier_id, purchased, barber_products(name), dossiers!inner(client_id, finalized_at)")
        .eq("purchased", true)
        .in("dossiers.client_id", ids)
        .order("finalized_at", { ascending: false, referencedTable: "dossiers" })
        .limit(100)
    : { data: [] as Array<{ dossier_id: string; purchased: boolean; barber_products: { name: string } | { name: string }[] | null; dossiers: { client_id: string; finalized_at: string | null } | { client_id: string; finalized_at: string | null }[] }> };

  const lastProductByClient = new Map<string, { name: string; daysAgo: number }>();
  (lastProducts ?? []).forEach((row) => {
    const dRel = Array.isArray(row.dossiers) ? row.dossiers[0] : row.dossiers;
    if (!dRel) return;
    const cid = dRel.client_id;
    if (lastProductByClient.has(cid)) return;
    const bp = Array.isArray(row.barber_products) ? row.barber_products[0] : row.barber_products;
    const name = bp?.name ?? "Produto";
    const daysAgo = dRel.finalized_at ? Math.floor((Date.now() - new Date(dRel.finalized_at).getTime()) / 86400000) : 0;
    lastProductByClient.set(cid, { name, daysAgo });
  });

  const enriched = await Promise.all(
    (clients ?? []).map(async (c) => ({
      ...c,
      photoUrl: c.photo_url ? await getSignedUrl("client-photos", c.photo_url, 3600) : null,
      dossierCount: dossierCount.get(c.id) ?? 0,
      lastProduct: lastProductByClient.get(c.id) ?? null,
    })),
  );

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <header className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
            Clientes
          </p>
          <h1 className="font-display text-h1 mt-2">Sua base</h1>
        </div>
        <Link
          href="/clientes/novo"
          className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 transition-all"
        >
          + Novo cliente
        </Link>
      </header>

      {/* Filtros */}
      <form className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {Object.entries(FILTER_LABELS).map(([key, label]) => {
            const active = filter === key;
            const href = `/clientes?filter=${key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
            return (
              <Link
                key={key}
                href={href}
                className={`h-9 px-4 inline-flex items-center rounded-full text-body-sm transition-colors ${
                  active
                    ? "bg-neutral-900 text-neutral-50"
                    : "bg-surface-card border border-border-subtle text-text-secondary hover:border-border-strong"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, telefone ou Instagram…"
          className="w-full h-touch px-4 rounded-md bg-surface-card border border-border-strong text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
        />
        {filter !== "todos" && <input type="hidden" name="filter" value={filter} />}
      </form>

      {/* Lista */}
      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-display text-h3 text-text-muted">
            {q || filter !== "todos" ? "Nenhum cliente nesse filtro" : "Sua base está vazia"}
          </p>
          {(q || filter !== "todos") ? (
            <Link href="/clientes" className="inline-block mt-4 text-primary-600 hover:underline">
              Limpar filtros
            </Link>
          ) : (
            <Link href="/clientes/novo" className="inline-flex h-touch px-5 items-center mt-6 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors">
              + Cadastrar primeiro cliente
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {enriched.map((c, i) => {
            const initials = c.full_name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
            const status = (c.client_status as string) ?? "novo";
            return (
              <FadeIn key={c.id} index={i}>
                <li><Link
                  href={`/clientes/${c.id}`}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-md bg-surface-card border border-border-subtle hover:border-border-strong hover:shadow-1 transition-all"
                >
                  {c.photoUrl ? (
                    <Image src={c.photoUrl} alt="" width={40} height={40} unoptimized className="size-10 rounded-full object-cover bg-neutral-200" />
                  ) : (
                    <span className="size-10 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-body-sm shrink-0">
                      {initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto_auto] items-center gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-body-lg truncate group-hover:text-primary-600 transition-colors">
                        {c.full_name}
                      </p>
                      <p className="text-caption text-text-muted truncate">
                        {c.dossierCount} dossiê{c.dossierCount === 1 ? "" : "s"}
                        {c.last_visit_at
                          ? ` · há ${c.days_since_visit} dia${c.days_since_visit === 1 ? "" : "s"}`
                          : " · sem visitas"}
                        {c.lastProduct ? ` · ${c.lastProduct.name} (há ${c.lastProduct.daysAgo}d)` : ""}
                      </p>
                    </div>
                    <ClientStatusBadge status={status} />
                  </div>
                </Link></li>
              </FadeIn>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function ClientStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    novo: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
    ativo: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
    dormindo: "bg-status-edited-bg text-status-edited-fg ring-status-edited-ring",
    frio: "bg-status-conflict-bg text-status-conflict-fg ring-status-conflict-ring",
    perdido: "bg-neutral-200 text-neutral-700 ring-neutral-300",
  };
  const labels: Record<string, string> = {
    novo: "Novo",
    ativo: "Ativo",
    dormindo: "Dormindo",
    frio: "Frio",
    perdido: "Perdido",
  };
  return (
    <span
      className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset shrink-0 ${styles[status] ?? styles.novo}`}
      style={{ letterSpacing: "0.06em" }}
    >
      {labels[status] ?? status}
    </span>
  );
}
