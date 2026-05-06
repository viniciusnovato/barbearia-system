import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { SortableProductGrid } from "./_components/SortableProductGrid";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category = "", page: pageRaw = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageRaw, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const supabase = await createServerSupabase();

  let query = supabase
    .from("barber_products")
    .select("id, name, photo_path, description, price_brl, category, sort_order", { count: "exact" })
    .order("sort_order", { ascending: true })
    .order("name");
  if (category) query = query.eq("category", category);

  // Lista de categorias distintas (sem aplicar filtro pra mostrar todas)
  const { data: catRows } = await supabase
    .from("barber_products")
    .select("category")
    .not("category", "is", null);
  const categories = Array.from(new Set((catRows ?? []).map((r) => r.category).filter(Boolean))) as string[];

  const { data: products, count } = await query.range(offset, offset + PAGE_SIZE - 1);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  type ProductRow = { id: string; name: string; photo_path: string | null; description: string | null; price_brl: number | null; category: string | null; sort_order: number };
  const enriched = await Promise.all(
    ((products ?? []) as ProductRow[]).map(async (p) => ({
      ...p,
      photoUrl: p.photo_path ? await getSignedUrl("barber-assets", p.photo_path, 3600) : null,
    })),
  );

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <header className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
            Catálogo
          </p>
          <h1 className="font-display text-h1 mt-2">Seus produtos</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Cadastre uma vez e adicione aos dossiês com um clique.
          </p>
        </div>
        <Link
          href="/produtos/novo"
          className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 transition-all"
        >
          + Novo produto
        </Link>
      </header>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Link
            href="/produtos"
            className={`h-9 px-4 inline-flex items-center rounded-full text-body-sm transition-colors ${
              !category ? "bg-neutral-900 text-neutral-50" : "bg-surface-card border border-border-subtle text-text-secondary hover:border-border-strong"
            }`}
          >
            Todas
          </Link>
          {categories.map((c) => {
            const active = category === c;
            return (
              <Link
                key={c}
                href={`/produtos?category=${encodeURIComponent(c)}`}
                className={`h-9 px-4 inline-flex items-center rounded-full text-body-sm transition-colors ${
                  active ? "bg-neutral-900 text-neutral-50" : "bg-surface-card border border-border-subtle text-text-secondary hover:border-border-strong"
                }`}
              >
                {c}
              </Link>
            );
          })}
        </div>
      )}

      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-12 text-center">
          <p className="font-display text-h3 text-text-muted">Catálogo vazio</p>
          <p className="text-body-sm text-text-secondary mt-2">
            Cadastre os produtos que você indica para ter sempre à mão.
          </p>
          <Link
            href="/produtos/novo"
            className="inline-flex h-touch px-5 items-center mt-6 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
          >
            + Cadastrar primeiro produto
          </Link>
        </div>
      ) : (
        <SortableProductGrid
          initial={enriched.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price_brl: p.price_brl,
            category: p.category,
            photoUrl: p.photoUrl,
          }))}
        />
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-3">
          <span className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
            Página {page} de {totalPages} · {count} produto(s)
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/produtos?${new URLSearchParams({ ...(category && { category }), page: String(page - 1) }).toString()}`}
                className="h-9 px-3 inline-flex items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/produtos?${new URLSearchParams({ ...(category && { category }), page: String(page + 1) }).toString()}`}
                className="h-9 px-3 inline-flex items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors"
              >
                Próxima →
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
