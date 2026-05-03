import Link from "next/link";
import Image from "next/image";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const supabase = await createServerSupabase();

  let query = supabase
    .from("clients")
    .select("id, full_name, phone, instagram, photo_url, created_at, dossiers(id)")
    .order("full_name", { ascending: true });

  if (q.trim().length > 0) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,instagram.ilike.%${q}%`);
  }

  const { data: clients } = await query;

  const enriched = await Promise.all(
    (clients ?? []).map(async (c) => ({
      ...c,
      photoUrl: c.photo_url ? await getSignedUrl("client-photos", c.photo_url, 3600) : null,
      dossierCount: Array.isArray(c.dossiers) ? c.dossiers.length : 0,
    })),
  );

  return (
    <main className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
      <header className="flex items-end justify-between gap-4 mb-8">
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

      {/* Busca */}
      <form className="mb-8">
        <label className="block">
          <span className="sr-only">Buscar cliente</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, telefone ou Instagram…"
            className="w-full h-touch px-4 rounded-md bg-surface-card border border-border-strong text-body focus:border-primary-500 focus:shadow-focus focus:outline-none transition-all"
          />
        </label>
      </form>

      {/* Lista */}
      {enriched.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-12 text-center">
          {q ? (
            <>
              <p className="font-display text-h3 text-text-muted">Nenhum cliente encontrado para "{q}"</p>
              <Link href="/clientes" className="inline-block mt-4 text-primary-600 hover:underline">
                Limpar busca
              </Link>
            </>
          ) : (
            <>
              <p className="font-display text-h3 text-text-muted">Sua base está vazia</p>
              <p className="text-body-sm text-text-secondary mt-2">Cadastre seu primeiro cliente para começar.</p>
              <Link
                href="/clientes/novo"
                className="inline-flex h-touch px-5 items-center mt-6 rounded-md bg-primary-500 text-neutral-50 font-medium hover:bg-primary-600 transition-colors"
              >
                + Cadastrar cliente
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enriched.map((c) => {
            const initials = c.full_name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="group flex items-center gap-4 p-4 rounded-lg bg-surface-card border border-border-subtle hover:border-primary-300 hover:shadow-2 transition-all"
                >
                  {c.photoUrl ? (
                    <Image
                      src={c.photoUrl}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                      className="size-14 rounded-full object-cover bg-neutral-200"
                    />
                  ) : (
                    <span className="size-14 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-h4 shrink-0">
                      {initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-h4 group-hover:text-primary-600 transition-colors truncate">
                      {c.full_name}
                    </p>
                    <p className="text-body-sm text-text-muted truncate">
                      {c.dossierCount} {c.dossierCount === 1 ? "dossiê" : "dossiês"}
                      {c.instagram ? ` · ${c.instagram}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
