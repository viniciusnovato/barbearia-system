import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import { ANGLES } from "./_const";
import { addClientPhotoAction, deleteClientPhotoAction } from "./actions";
import { PhotoUploader } from "./_components/PhotoUploader";

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
              {list.length === 0 ? (
                <div className="rounded-md border border-dashed border-border-subtle p-6 text-center text-body-sm text-text-muted">
                  Nenhuma foto deste ângulo ainda.
                </div>
              ) : (
                <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map((p) => (
                    <li key={p.id} className="group relative rounded-lg overflow-hidden bg-neutral-200 aspect-[4/3]">
                      {p.url ? (
                        <Image src={p.url} alt={p.caption ?? angleDef.label} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-muted text-caption">indisponível</div>
                      )}
                      <form action={deleteClientPhotoAction} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="client_id" value={id} />
                        <button
                          type="submit"
                          title="Remover"
                          className="size-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-danger transition-colors backdrop-blur"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
                        </button>
                      </form>
                      {p.caption && (
                        <p className="absolute bottom-0 inset-x-0 px-3 py-2 text-caption text-white bg-gradient-to-t from-black/70 to-transparent">
                          {p.caption}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
