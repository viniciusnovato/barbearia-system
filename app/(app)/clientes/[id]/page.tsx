import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { createDossierAction } from "../../dossie/actions";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function ClientProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: client } = await supabase
    .from("clients_with_status")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const photoUrl = await getSignedUrl("client-photos", client.photo_url, 3600);

  const { data: dossiers } = await supabase
    .from("dossiers")
    .select("id, title, scheduled_date, status, finalized_at, summary_done")
    .eq("client_id", id)
    .order("scheduled_date", { ascending: false });

  // Galeria de fotos do cliente (independente de dossiê)
  const { data: clientGallery } = await supabase
    .from("client_photos")
    .select("id, angle, storage_path, caption")
    .eq("client_id", id)
    .order("created_at", { ascending: false })
    .limit(6);
  const galleryEnriched = await Promise.all(
    (clientGallery ?? []).map(async (g) => ({
      ...g,
      url: await getSignedUrl("client-photos", g.storage_path, 3600),
    })),
  );

  // Imagens por dossiê (foto_cliente + marcacao_ipad)
  const dossierIds = (dossiers ?? []).map((d) => d.id);
  const { data: assets } = dossierIds.length
    ? await supabase
        .from("media_assets")
        .select("id, dossier_id, kind, storage_path, bucket, caption, included_in_pdf, created_at")
        .in("dossier_id", dossierIds)
        .in("kind", ["foto_cliente", "marcacao_ipad"])
        .order("created_at", { ascending: true })
    : { data: [] as Array<{ id: string; dossier_id: string; kind: string; storage_path: string; bucket: string; caption: string | null; included_in_pdf: boolean; created_at: string }> };

  const assetsByDossier = new Map<string, typeof assets>();
  (assets ?? []).forEach((a) => {
    const arr = assetsByDossier.get(a.dossier_id) ?? [];
    arr.push(a);
    assetsByDossier.set(a.dossier_id, arr);
  });

  const enrichedDossiers = await Promise.all(
    (dossiers ?? []).map(async (d) => {
      const dossierAssets = assetsByDossier.get(d.id) ?? [];
      const beforeAsset = dossierAssets.find((a) => a.kind === "foto_cliente");
      const afterAsset = dossierAssets.find((a) => a.kind === "marcacao_ipad");
      return {
        ...d,
        beforeUrl: beforeAsset ? await getSignedUrl(beforeAsset.bucket, beforeAsset.storage_path, 3600) : null,
        afterUrl: afterAsset ? await getSignedUrl(afterAsset.bucket, afterAsset.storage_path, 3600) : null,
      };
    }),
  );

  // Último produto comprado
  const { data: lastProductRow } = dossierIds.length
    ? await supabase
        .from("products")
        .select("purchased, barber_products(name), dossiers!inner(client_id, finalized_at)")
        .eq("purchased", true)
        .in("dossiers.client_id", [id])
        .order("finalized_at", { ascending: false, referencedTable: "dossiers" })
        .limit(1)
    : { data: [] as Array<{ purchased: boolean; barber_products: { name: string } | { name: string }[] | null; dossiers: { client_id: string; finalized_at: string | null } | { client_id: string; finalized_at: string | null }[] }> };
  const lastProduct = (() => {
    const row = lastProductRow?.[0];
    if (!row) return null;
    const dRel = Array.isArray(row.dossiers) ? row.dossiers[0] : row.dossiers;
    if (!dRel || !dRel.finalized_at) return null;
    const bp = Array.isArray(row.barber_products) ? row.barber_products[0] : row.barber_products;
    const days = Math.floor((Date.now() - new Date(dRel.finalized_at).getTime()) / 86400000);
    return { name: bp?.name ?? "Produto", days };
  })();

  const initials = client.full_name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();
  const status = (client.client_status as string) ?? "novo";

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      <Link href="/clientes" className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← Clientes
      </Link>

      {/* Header */}
      <header className="flex flex-col sm:flex-row gap-6 sm:items-end justify-between mb-6">
        <div className="flex items-center gap-5">
          {photoUrl ? (
            <Image src={photoUrl} alt="" width={96} height={96} unoptimized className="size-24 rounded-full object-cover bg-neutral-200" />
          ) : (
            <span className="size-24 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 text-neutral-50 flex items-center justify-center font-display text-h2">
              {initials}
            </span>
          )}
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Cliente · {status}
            </p>
            <h1 className="font-display text-h1 mt-1">{client.full_name}</h1>
            <p className="text-body-sm text-text-muted mt-1">
              {[client.phone, client.instagram].filter(Boolean).join(" · ") || "Sem contatos cadastrados"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link href={`/clientes/${id}/editar`} className="h-touch px-4 inline-flex items-center rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
            Editar
          </Link>
          <Link href={`/clientes/${id}/fotos`} className="h-touch px-4 inline-flex items-center gap-2 rounded-md border border-border-strong text-body-sm hover:bg-surface-sunken transition-colors">
            📷 Galeria
          </Link>
          <form action={createDossierAction}>
            <input type="hidden" name="client_id" value={id} />
            <button type="submit" className="h-touch px-5 inline-flex items-center gap-2 rounded-md bg-primary-500 text-neutral-50 font-medium shadow-1 hover:bg-primary-600 transition-all">
              + Novo dossiê
            </button>
          </form>
        </div>
      </header>

      {/* Avisos contextuais */}
      <div className="flex flex-wrap gap-2 mb-8">
        {lastProduct && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-status-suggested-bg text-status-suggested-fg ring-1 ring-inset ring-status-suggested-ring">
            <span className="text-body-sm">
              💡 Comprou <strong>{lastProduct.name}</strong> há {lastProduct.days} dia{lastProduct.days === 1 ? "" : "s"}
              {lastProduct.days >= 30 ? " — hora de oferecer reposição" : ""}
            </span>
          </div>
        )}
        {client.last_visit_at && client.days_since_visit >= 45 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-md bg-status-edited-bg text-status-edited-fg ring-1 ring-inset ring-status-edited-ring">
            <span className="text-body-sm">
              ⏰ Última visita há {client.days_since_visit} dias — chamar para retorno
            </span>
          </div>
        )}
      </div>

      {/* Mini-galeria */}
      {galleryEnriched.length > 0 && (
        <section className="mb-10">
          <header className="flex items-end justify-between mb-3">
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Galeria · {galleryEnriched.length} foto{galleryEnriched.length === 1 ? "" : "s"}
            </p>
            <Link href={`/clientes/${id}/fotos`} className="text-body-sm text-primary-600 hover:underline">
              Ver todas →
            </Link>
          </header>
          <ul className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {galleryEnriched.map((g) => (
              <li key={g.id} className="aspect-square rounded-md overflow-hidden bg-neutral-200">
                {g.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.url} alt={g.caption ?? g.angle} className="w-full h-full object-cover" />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Notas */}
      {client.notes && (
        <section className="mb-10 rounded-lg bg-surface-sunken p-5">
          <p className="font-mono text-mono uppercase text-text-muted mb-2" style={{ letterSpacing: "0.08em" }}>
            Observações internas
          </p>
          <p className="text-body whitespace-pre-wrap">{client.notes}</p>
        </section>
      )}

      {/* Timeline */}
      <section>
        <header className="flex items-end justify-between mb-4">
          <div>
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Evolução
            </p>
            <h2 className="font-display text-h2 mt-1">Histórico ({enrichedDossiers.length})</h2>
          </div>
        </header>

        {enrichedDossiers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-strong p-10 text-center">
            <p className="font-display text-h4 text-text-muted">Nenhum dossiê ainda</p>
            <p className="text-body-sm text-text-secondary mt-2">Clique em "Novo dossiê" pra começar.</p>
          </div>
        ) : (
          <ol className="relative ml-4 border-l border-border-subtle">
            {enrichedDossiers.map((d) => (
              <li key={d.id} className="ml-6 mb-6 relative">
                <span className="absolute -left-[31px] top-3 size-3 rounded-full bg-surface-card border-2 border-primary-500" />
                <Link href={`/dossie/${d.id}`} className="block rounded-lg bg-surface-card border border-border-subtle hover:border-primary-300 transition-colors overflow-hidden">
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-display text-h4">{d.title}</p>
                      <p className="text-caption text-text-muted mt-1 font-mono uppercase" style={{ letterSpacing: "0.06em" }}>
                        {new Date(d.scheduled_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <DossierStatusBadge status={d.status} />
                  </div>

                  {(d.beforeUrl || d.afterUrl) && (
                    <div className="px-5 pb-3 grid grid-cols-2 gap-2">
                      <div className="aspect-[4/3] rounded-md overflow-hidden bg-neutral-200">
                        {d.beforeUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.beforeUrl} alt="Antes" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-caption">sem foto</div>
                        )}
                        <p className="hidden">antes</p>
                      </div>
                      <div className="aspect-[4/3] rounded-md overflow-hidden bg-neutral-200 relative">
                        {d.afterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.afterUrl} alt="Depois" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted text-caption">sem anotação</div>
                        )}
                        {d.afterUrl && (
                          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-primary-500/90 text-white font-mono text-[10px] uppercase backdrop-blur" style={{ letterSpacing: "0.08em" }}>
                            anotado
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {d.summary_done && (
                    <p className="px-5 pb-4 text-body-sm text-text-secondary border-t border-border-subtle pt-3">
                      <strong className="text-text-primary">Realizado:</strong> {d.summary_done}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function DossierStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    rascunho: "bg-status-empty-bg text-status-empty-fg ring-status-empty-ring",
    em_revisao: "bg-status-suggested-bg text-status-suggested-fg ring-status-suggested-ring",
    finalizado: "bg-status-approved-bg text-status-approved-fg ring-status-approved-ring",
  };
  const labels: Record<string, string> = { rascunho: "Rascunho", em_revisao: "Em revisão", finalizado: "Finalizado" };
  return (
    <span className={`text-caption uppercase font-medium px-2.5 h-6 inline-flex items-center rounded-full ring-1 ring-inset shrink-0 ${styles[status] ?? styles.rascunho}`} style={{ letterSpacing: "0.06em" }}>
      {labels[status] ?? status}
    </span>
  );
}
