import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { DOSSIER_SECTIONS, REQUIRED_FIELDS, isFieldReady } from "@/lib/dossier/schema";
import { DossierEditor } from "./_components/DossierEditor";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}

export default async function DossierPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { section: activeSection = "diagnostico" } = await searchParams;
  const supabase = await createServerSupabase();

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("*, clients!inner(id, full_name, photo_url)")
    .eq("id", id)
    .maybeSingle();
  if (!dossier) notFound();

  const client = Array.isArray(dossier.clients) ? dossier.clients[0] : dossier.clients;

  const [{ data: fields }, { data: blocks }, { data: audios }] = await Promise.all([
    supabase.from("dossier_fields").select("*").eq("dossier_id", id),
    supabase.from("transcript_blocks").select("*").eq("dossier_id", id).order("ord"),
    supabase.from("audio_recordings").select("id, source, duration_seconds, processed_at, created_at, transcript_full, error").eq("dossier_id", id).order("created_at", { ascending: false }),
  ]);

  // Progresso por seção:
  //   filled = qualquer status != vazio (tem conteúdo)
  //   ready  = isFieldReady (editado ou aprovado, com valor) — é o que conta pra finalizar
  const progress = DOSSIER_SECTIONS.map((s) => {
    const total = s.fields.length;
    if (total === 0) return { id: s.id, total: 0, filled: 0, ready: 0 };
    const sectionFields = (fields ?? []).filter((f) => f.section === s.id);
    const filled = sectionFields.filter((f) => f.status !== "vazio").length;
    const ready = sectionFields.filter((f) => isFieldReady(f)).length;
    return { id: s.id, total, filled, ready };
  });

  // Validação obrigatórios — usa o helper centralizado
  const missingRequired = REQUIRED_FIELDS.filter((k) => !isFieldReady(fields?.find((x) => x.field_key === k)));

  return (
    <DossierEditor
      dossier={{ id: dossier.id, title: dossier.title, status: dossier.status, scheduled_date: dossier.scheduled_date, pdf_url: dossier.pdf_url }}
      client={{ id: client.id, full_name: client.full_name }}
      activeSection={activeSection}
      fields={fields ?? []}
      blocks={blocks ?? []}
      audios={audios ?? []}
      progress={progress}
      missingRequiredCount={missingRequired.length}
    />
  );
}

export const dynamic = "force-dynamic";
