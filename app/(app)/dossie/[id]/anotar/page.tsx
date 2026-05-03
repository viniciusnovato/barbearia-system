import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { PhotoUploader } from "./_components/PhotoUploader";

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

  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, kind, storage_path, bucket, caption, created_at, parent_asset_id")
    .eq("dossier_id", id)
    .eq("kind", "foto_cliente")
    .is("parent_asset_id", null)
    .order("created_at", { ascending: false });

  // Signed URLs
  const enriched = await Promise.all(
    (assets ?? []).map(async (a) => ({
      ...a,
      url: await getSignedUrl(a.bucket, a.storage_path, 3600),
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
        Suba uma foto do cliente e abra a tela de desenho para marcar com Apple Pencil sobre a imagem.
      </p>

      {enriched.length === 0 ? (
        <PhotoUploader dossierId={id} />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {enriched.map((a) => (
              <Link key={a.id} href={`/dossie/${id}/anotar/${a.id}`} className="group rounded-lg overflow-hidden bg-surface-card border border-border-subtle hover:border-primary-300 hover:shadow-2 transition-all">
                {a.url ? (
                  <Image src={a.url} alt="" width={400} height={300} unoptimized className="w-full aspect-[4/3] object-cover" />
                ) : (
                  <div className="w-full aspect-[4/3] bg-neutral-200 flex items-center justify-center text-text-muted">sem preview</div>
                )}
                <div className="p-3">
                  <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.08em" }}>
                    Foto principal
                  </p>
                  <p className="text-body-sm group-hover:text-primary-600 transition-colors">
                    Desenhar com iPad →
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <PhotoUploader dossierId={id} compact />
        </>
      )}
    </main>
  );
}
