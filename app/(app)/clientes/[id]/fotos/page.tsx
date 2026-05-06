import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { ANGLES } from "./_const";
import { addClientPhotoAction } from "./actions";
import { PhotoUploader } from "./_components/PhotoUploader";
import { SortablePhotoGrid } from "./_components/SortablePhotoGrid";

export const dynamic = "force-dynamic";

interface PageProps { params: Promise<{ id: string }> }

export default async function ClientPhotosPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: client } = await supabase
    .from("clients")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const { data: photos } = await supabase
    .from("client_photos")
    .select("id, angle, storage_path, caption, sort_order, created_at")
    .eq("client_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const enriched = await Promise.all(
    (photos ?? []).map(async (p) => ({
      ...p,
      url: await getSignedUrl("client-photos", p.storage_path, 3600),
    })),
  );

  // Agrupa por ângulo
  const byAngle = new Map<string, typeof enriched>();
  ANGLES.forEach((a) => byAngle.set(a.id, []));
  enriched.forEach((p) => {
    const arr = byAngle.get(p.angle) ?? [];
    arr.push(p);
    byAngle.set(p.angle, arr);
  });

  return (
    <main className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      <Link href={`/clientes/${id}`} className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← {client.full_name}
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.12em" }}>
        Galeria de fotos
      </p>
      <h1 className="font-display text-h1 mt-2 mb-2">{client.full_name}</h1>
      <p className="text-body-lg text-text-secondary mb-8">
        Colecione fotos de vários ângulos para análise e referência futura. Use em qualquer dossiê.
      </p>

      {/* Uploader */}
      <section className="mb-10 rounded-2xl bg-surface-card border border-border-subtle p-6">
        <p className="font-mono text-mono uppercase text-text-muted mb-3" style={{ letterSpacing: "0.1em" }}>
          Adicionar foto
        </p>
        <PhotoUploader clientId={id} action={addClientPhotoAction} />
      </section>

      {/* Galeria por ângulo */}
      <div className="flex flex-col gap-8">
        {ANGLES.map((angleDef) => {
          const list = byAngle.get(angleDef.id) ?? [];
          return (
            <section key={angleDef.id}>
              <header className="flex items-center justify-between mb-3">
                <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
                  {angleDef.label}
                </p>
                <span className="font-mono text-caption text-text-muted">{list.length} foto{list.length === 1 ? "" : "s"}</span>
              </header>
              <SortablePhotoGrid
                clientId={id}
                angleLabel={angleDef.label}
                initial={list.map((p) => ({ id: p.id, url: p.url, caption: p.caption }))}
              />
            </section>
          );
        })}
      </div>
    </main>
  );
}
