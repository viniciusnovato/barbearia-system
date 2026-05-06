import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AudioCapture } from "./_components/AudioCapture";

interface PageProps { params: Promise<{ id: string }> }

export default async function RecordPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: dossier } = await supabase
    .from("dossiers")
    .select("id, title, mode, clients!inner(id, full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!dossier) notFound();

  const client = Array.isArray(dossier.clients) ? dossier.clients[0] : dossier.clients;
  const initialMode = (dossier.mode ?? "entrevista") as "entrevista" | "acompanhamento" | "antes_depois";

  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
      <Link href={`/dossie/${id}`} className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1 mb-6">
        ← {dossier.title}
      </Link>
      <p className="font-mono text-mono uppercase text-text-muted" style={{ letterSpacing: "0.1em" }}>
        Captura · {client.full_name}
      </p>
      <h1 className="font-display text-h1 mt-2 mb-8">Gravar áudio ou vídeo</h1>

      <AudioCapture dossierId={id} initialMode={initialMode} />
    </main>
  );
}
