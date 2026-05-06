import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { FadeIn } from "@/app/(app)/_components/FadeIn";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from("barber_products")
    .select("id, name, photo_path, description, price_brl")
    .order("name");

  const enriched = await Promise.all(
    (products ?? []).map(async (p) => ({
      ...p,
      photoUrl: p.photo_path ? await getSignedUrl("barber-assets", p.photo_path, 3600) : null,
    })),
  );

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
      <header className="flex items-end justify-between mb-8 gap-4">
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
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((p, i) => (
            <FadeIn key={p.id} index={i}>
              <li><Link
                href={`/produtos/${p.id}`}
                className="group block rounded-lg bg-surface-card border border-border-subtle hover:border-primary-300 hover:shadow-2 transition-all overflow-hidden"
              >
                {p.photoUrl ? (
                  <Image
                    src={p.photoUrl}
                    alt={p.name}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full aspect-[4/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[4/3] bg-surface-sunken flex items-center justify-center">
                    <span className="font-display text-h2 text-text-muted">
                      {p.name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <p className="font-display text-h4 group-hover:text-primary-600 transition-colors">{p.name}</p>
                  {p.description && (
                    <p className="text-body-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>
                  )}
                  {p.price_brl && (
                    <p className="font-mono text-body-sm mt-2 text-primary-700">
                      R$ {Number(p.price_brl).toFixed(2).replace(".", ",")}
                    </p>
                  )}
                </div>
              </Link></li>
            </FadeIn>
          ))}
        </ul>
      )}
    </main>
  );
}
