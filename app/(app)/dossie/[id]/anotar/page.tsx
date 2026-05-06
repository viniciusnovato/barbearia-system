import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { PhotoUploader } from "./_components/PhotoUploader";
import { GalleryImporter } from "./_components/GalleryImporter";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function AnnotateIndexPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, title, clients!inner(id, full_name, photo_url)")
    .eq("id", id)
    .maybeSingle();
  if (!dossier) notFound();
  const client = Array.isArray(dossier.clients) ? dossier.clients[0] : dossier.clients;

  const [{ data: assets }, { data: gallery }] = await Promise.all([
    supabase
      .from("media_assets")
      .select("id, kind, storage_path, bucket, caption, created_at, parent_asset_id")
      .eq("dossier_id", id)
      .eq("kind", "foto_cliente")
      .is("parent_asset_id", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("client_photos")
      .select("id, angle, storage_path, caption")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const enriched = await Promise.all(
    (assets ?? []).map(async (a) => ({
      ...a,
      url: await getSignedUrl(a.bucket, a.storage_path, 3600),
    })),
  );
  const galleryEnriched = await Promise.all(
    (gallery ?? []).map(async (g) => ({
      ...g,
      url: await getSignedUrl("client-photos", g.storage_path, 3600),
    })),
  );

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      <Link href={`/dossie/${id}`} className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← {dossier.title}
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
        Desenhe com iPad
      </p>
      <h1 className="font-display text-h1 mt-2 mb-2">{client.full_name}</h1>
      <p className="text-body-lg text-text-secondary mb-8">
        Suba uma foto ou puxe da galeria do cliente, depois abra a tela de desenho para marcar com Apple Pencil.
      </p>

      {/* Fotos do dossiê */}
      {enriched.length > 0 && (
        <section className="mb-8">
          <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
            Fotos deste dossiê
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enriched.map((a) => (
              <Link key={a.id} href={`/dossie/${id}/anotar/${a.id}`} className="group rounded-lg overflow-hidden bg-surface-card border border-border-subtle hover:border-primary-300 hover:shadow-2 transition-all">
                {a.url ? (
                  <Image src={a.url} alt="" width={400} height={300} unoptimized className="w-full aspect-[4/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center text-text-muted">sem preview</div>
                )}
                <div className="p-3">
                  <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
                    Foto do dossiê
                  </p>
                  <p className="text-body-sm group-hover:text-primary-600 transition-colors">
                    Desenhar com iPad →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Galeria do cliente */}
      {galleryEnriched.length > 0 && (
        <section className="mb-8">
          <header className="flex items-end justify-between mb-3">
            <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
              Galeria de {client.full_name.split(" ")[0]} · {galleryEnriched.length} foto(s)
            </p>
            <Link href={`/clientes/${client.id}/fotos`} className="text-body-sm text-primary-600 hover:underline">
              Gerenciar galeria →
            </Link>
          </header>
          <GalleryImporter
            dossierId={id}
            photos={galleryEnriched.map((g) => ({ id: g.id, url: g.url, angle: g.angle, caption: g.caption }))}
          />
        </section>
      )}

      {/* Upload */}
      <section>
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          {enriched.length > 0 ? "Adicionar outra foto" : "Subir uma foto"}
        </p>
        <PhotoUploader dossierId={id} compact={enriched.length > 0} />
      </section>

      {enriched.length === 0 && galleryEnriched.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-strong p-10 text-center mt-8">
          <p className="font-display text-h3 text-text-muted">Sem foto ainda</p>
          <p className="text-body-sm text-text-secondary mt-2">
            Suba uma foto acima ou{" "}
            <Link href={`/clientes/${client.id}/fotos`} className="text-primary-600 hover:underline">
              monte a galeria do cliente
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}
